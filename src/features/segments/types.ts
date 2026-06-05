/**
 * Per-segment save lifecycle used by the editor and `SaveStatusBadge`.
 *
 * - idle:   in sync with the server, no local edits
 * - dirty:  has unsaved local edits (debounce/blur will flush them)
 * - saving: a save mutation is in flight
 * - saved:  successfully persisted (transient; decays back to idle in the UI)
 * - error:  the last save failed and can be retried
 */
export type SegmentSaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/** A single timestamped, speaker-attributed line of transcript. */
export interface TranscriptSegment {
	id: string;
	transcriptId: string;
	/** Zero-based position within the transcript. */
	index: number;
	speakerId: string;
	/** Segment bounds in seconds from the start of the recording. */
	startSec: number;
	endSec: number;
	text: string;
	/** ASR confidence in [0, 1]; absent for hand-typed segments. */
	confidence?: number;
	/** Bumped by the backend on every successful save (optimistic concurrency). */
	revision: number;
	updatedAt: string;
}

/**
 * Runtime save status for a segment. Kept in a TanStack Store keyed by segment
 * id rather than on the persisted model, because it is UI/session state.
 */
export interface SegmentSaveStatus {
	segmentId: string;
	state: SegmentSaveState;
	/** Server revision last confirmed saved. */
	savedRevision?: number;
	/** Populated when `state === "error"`. */
	error?: string;
	/** ISO timestamp of the last state transition. */
	updatedAt?: string;
}
