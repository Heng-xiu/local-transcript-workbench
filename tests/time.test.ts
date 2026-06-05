import { describe, expect, it } from "vitest";
import {
	formatClock,
	formatDuration,
	formatRelativeTime,
} from "@/lib/utils/time";

describe("formatClock", () => {
	it("formats sub-hour times as M:SS", () => {
		expect(formatClock(0)).toBe("0:00");
		expect(formatClock(5)).toBe("0:05");
		expect(formatClock(65)).toBe("1:05");
		expect(formatClock(600)).toBe("10:00");
	});

	it("formats times past an hour as H:MM:SS", () => {
		expect(formatClock(3661)).toBe("1:01:01");
	});

	it("clamps invalid input", () => {
		expect(formatClock(-3)).toBe("0:00");
		expect(formatClock(Number.NaN)).toBe("0:00");
	});
});

describe("formatDuration", () => {
	it("formats human-readable durations", () => {
		expect(formatDuration(0)).toBe("0s");
		expect(formatDuration(45)).toBe("45s");
		expect(formatDuration(125)).toBe("2m 05s");
		expect(formatDuration(3725)).toBe("1h 02m");
	});
});

describe("formatRelativeTime", () => {
	const now = Date.parse("2026-06-04T12:00:00.000Z");
	it("formats relative offsets", () => {
		expect(formatRelativeTime("2026-06-04T11:59:50.000Z", now)).toBe("just now");
		expect(formatRelativeTime("2026-06-04T11:30:00.000Z", now)).toBe("30m ago");
		expect(formatRelativeTime("2026-06-04T09:00:00.000Z", now)).toBe("3h ago");
		expect(formatRelativeTime("2026-06-01T12:00:00.000Z", now)).toBe("3d ago");
	});

	it("returns empty for invalid dates", () => {
		expect(formatRelativeTime("not-a-date", now)).toBe("");
	});
});
