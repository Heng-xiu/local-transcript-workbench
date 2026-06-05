/**
 * Per-segment save status, keyed by segment id. This is transient UI/session
 * state (not persisted on the model), so it lives in a TanStack Store rather
 * than in TanStack Query's cache. `SaveStatusBadge` subscribes to a single
 * segment's slice; the autosave hook drives the transitions.
 */
import { Store } from "@tanstack/store";
import type {
	SegmentSaveState,
	SegmentSaveStatus,
} from "@/features/segments/types";

export type SegmentStatusMap = Record<string, SegmentSaveStatus>;

export const segmentStatusStore = new Store<SegmentStatusMap>({});

function nowIso(): string {
	return new Date().toISOString();
}

function patch(segmentId: string, next: Partial<SegmentSaveStatus>): void {
	segmentStatusStore.setState((prev) => {
		const current: SegmentSaveStatus = prev[segmentId] ?? {
			segmentId,
			state: "idle",
		};
		return {
			...prev,
			[segmentId]: { ...current, ...next, segmentId, updatedAt: nowIso() },
		};
	});
}

export const segmentStatusActions = {
	get(segmentId: string): SegmentSaveStatus {
		return segmentStatusStore.state[segmentId] ?? { segmentId, state: "idle" };
	},
	set(segmentId: string, state: SegmentSaveState): void {
		patch(segmentId, { state, error: undefined });
	},
	markDirty(segmentId: string): void {
		patch(segmentId, { state: "dirty", error: undefined });
	},
	markSaving(segmentId: string): void {
		patch(segmentId, { state: "saving", error: undefined });
	},
	markSaved(segmentId: string, savedRevision: number): void {
		patch(segmentId, { state: "saved", savedRevision, error: undefined });
	},
	markError(segmentId: string, error: string): void {
		patch(segmentId, { state: "error", error });
	},
	clear(segmentId: string): void {
		segmentStatusStore.setState((prev) => {
			if (!(segmentId in prev)) return prev;
			const next = { ...prev };
			delete next[segmentId];
			return next;
		});
	},
	reset(): void {
		segmentStatusStore.setState(() => ({}));
	},
};
