import { describe, expect, it } from "vitest";
import { buildMeetingRoomUrl } from "@/features/meetings/meeting-room-url";

describe("buildMeetingRoomUrl", () => {
	it("composes meet base + /rooms/ + code", () => {
		expect(buildMeetingRoomUrl("http://localhost:4000", "WA9EQB")).toBe(
			"http://localhost:4000/rooms/WA9EQB",
		);
	});

	it("url-encodes the meeting code", () => {
		expect(buildMeetingRoomUrl("http://localhost:4000", "a b/c")).toBe(
			"http://localhost:4000/rooms/a%20b%2Fc",
		);
	});
});
