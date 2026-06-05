import type { TranscriptSegment } from "./types";

/**
 * Index of the segment that is "active" at time `t`: the most recent segment
 * whose start is at or before `t`. Binary search keeps this O(log n) so it can
 * run on every playback tick without scanning thousands of rows. Returns -1
 * before the first segment starts.
 *
 * Segments are assumed sorted by `startSec` (they always are in this app).
 */
export function findActiveSegmentIndex(
	segments: readonly TranscriptSegment[],
	t: number,
): number {
	let lo = 0;
	let hi = segments.length - 1;
	let ans = -1;
	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		if (segments[mid].startSec <= t) {
			ans = mid;
			lo = mid + 1;
		} else {
			hi = mid - 1;
		}
	}
	return ans;
}
