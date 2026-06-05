import { useStore } from "@tanstack/react-store";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	segmentStatusActions,
	segmentStatusStore,
} from "@/lib/stores/segment-status-store";
import { useUpdateSegmentMutation } from "./queries";
import type { SegmentSaveStatus, TranscriptSegment } from "./types";

/** Wait this long after the last keystroke before autosaving. */
const DEBOUNCE_MS = 800;
/** How long a "saved" badge lingers before decaying back to idle. */
const SAVED_DECAY_MS = 1500;

export interface UseSegmentAutosaveResult {
	draft: string;
	status: SegmentSaveStatus;
	isDirty: boolean;
	/** Wire to the textarea's onChange value. */
	onChange: (value: string) => void;
	/** Wire to the textarea's onBlur. */
	onBlur: () => void;
	/** Force a save now (e.g. ⌘/Ctrl+Enter). */
	flush: () => void;
	/** Retry after a failed save. */
	retry: () => void;
}

/**
 * Owns a single segment's editing lifecycle.
 *
 * - keeps a local draft so typing never hits the API
 * - autosaves on debounce, on blur, and on unmount/scroll-away (segment switch)
 * - drives per-segment status (idle → dirty → saving → saved/error) via the
 *   TanStack Store, so transitions survive unmount without React warnings
 * - supports retry after a failure
 */
export function useSegmentAutosave(
	segment: TranscriptSegment,
	transcriptId: string,
): UseSegmentAutosaveResult {
	const mutation = useUpdateSegmentMutation(transcriptId);
	const mutateAsyncRef = useRef(mutation.mutateAsync);
	mutateAsyncRef.current = mutation.mutateAsync;

	const [draft, setDraft] = useState(segment.text);
	const draftRef = useRef(draft);
	const committedRef = useRef(segment.text);
	const revisionRef = useRef(segment.revision);
	const segmentIdRef = useRef(segment.id);
	segmentIdRef.current = segment.id;
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const decayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const rawStatus = useStore(segmentStatusStore, (map) => map[segment.id]);
	const status: SegmentSaveStatus = rawStatus ?? {
		segmentId: segment.id,
		state: "idle",
	};

	useEffect(() => {
		draftRef.current = draft;
	}, [draft]);
	useEffect(() => {
		revisionRef.current = segment.revision;
	}, [segment.revision]);

	// Adopt server-side text changes only when we have no local divergence, so
	// in-flight edits are never clobbered (and our own saved text is a no-op).
	useEffect(() => {
		if (
			segment.text !== committedRef.current &&
			draftRef.current === committedRef.current
		) {
			committedRef.current = segment.text;
			setDraft(segment.text);
		}
	}, [segment.text]);

	const clearDebounce = useCallback(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
			debounceRef.current = null;
		}
	}, []);

	const doSave = useCallback(async () => {
		clearDebounce();
		const id = segmentIdRef.current;
		const text = draftRef.current;
		if (text === committedRef.current) {
			if (segmentStatusStore.state[id]?.state === "dirty") {
				segmentStatusActions.set(id, "idle");
			}
			return;
		}
		segmentStatusActions.markSaving(id);
		try {
			const updated = await mutateAsyncRef.current({
				transcriptId,
				segmentId: id,
				text,
				baseRevision: revisionRef.current,
			});
			committedRef.current = updated.text;
			revisionRef.current = updated.revision;
			segmentStatusActions.markSaved(id, updated.revision);
			if (decayRef.current) clearTimeout(decayRef.current);
			decayRef.current = setTimeout(() => {
				if (segmentStatusStore.state[id]?.state === "saved") {
					segmentStatusActions.set(id, "idle");
				}
			}, SAVED_DECAY_MS);
		} catch (err) {
			segmentStatusActions.markError(
				id,
				err instanceof Error ? err.message : "Save failed",
			);
		}
	}, [transcriptId, clearDebounce]);

	const doSaveRef = useRef(doSave);
	doSaveRef.current = doSave;

	const onChange = useCallback(
		(value: string) => {
			setDraft(value);
			draftRef.current = value;
			clearDebounce();
			if (value === committedRef.current) {
				segmentStatusActions.set(segmentIdRef.current, "idle");
				return;
			}
			segmentStatusActions.markDirty(segmentIdRef.current);
			debounceRef.current = setTimeout(() => {
				void doSaveRef.current();
			}, DEBOUNCE_MS);
		},
		[clearDebounce],
	);

	const onBlur = useCallback(() => {
		clearDebounce();
		if (draftRef.current !== committedRef.current) {
			void doSaveRef.current();
		}
	}, [clearDebounce]);

	const flush = useCallback(() => {
		void doSaveRef.current();
	}, []);

	const retry = useCallback(() => {
		void doSaveRef.current();
	}, []);

	// Flush on unmount (the segment scrolled out of the virtual window).
	useEffect(() => {
		return () => {
			clearDebounce();
			if (decayRef.current) clearTimeout(decayRef.current);
			if (draftRef.current !== committedRef.current) {
				void doSaveRef.current();
			}
		};
	}, [clearDebounce]);

	return {
		draft,
		status,
		isDirty: status.state === "dirty",
		onChange,
		onBlur,
		flush,
		retry,
	};
}
