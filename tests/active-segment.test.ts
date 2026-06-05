import { describe, expect, it } from "vitest";
import { findActiveSegmentIndex } from "@/features/segments/active-segment";
import type { TranscriptSegment } from "@/features/segments/types";

function seg(index: number, startSec: number, endSec: number): TranscriptSegment {
	return {
		id: `s${index}`,
		transcriptId: "t",
		index,
		speakerId: "spk",
		startSec,
		endSec,
		text: "x",
		revision: 1,
		updatedAt: "2026-06-04T00:00:00.000Z",
	};
}

const segments = [
	seg(0, 0, 5),
	seg(1, 5, 10),
	seg(2, 10, 18),
	seg(3, 20, 25),
];

describe("findActiveSegmentIndex", () => {
	it("returns -1 before the first segment", () => {
		expect(findActiveSegmentIndex(segments, -1)).toBe(-1);
	});

	it("finds the segment containing the time", () => {
		expect(findActiveSegmentIndex(segments, 0)).toBe(0);
		expect(findActiveSegmentIndex(segments, 7)).toBe(1);
		expect(findActiveSegmentIndex(segments, 17.9)).toBe(2);
	});

	it("returns the most recent started segment during a gap", () => {
		expect(findActiveSegmentIndex(segments, 19)).toBe(2);
	});

	it("clamps to the last segment past the end", () => {
		expect(findActiveSegmentIndex(segments, 999)).toBe(3);
	});

	it("handles empty input", () => {
		expect(findActiveSegmentIndex([], 5)).toBe(-1);
	});
});
