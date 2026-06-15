import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE = "http://localhost:4001/api";

async function loadAdapter() {
	vi.resetModules();
	vi.stubEnv("VITE_MEETING_API_BASE_URL", BASE);
	return (await import("./meeting-api-meetings")).meetingApiMeetings;
}

function mockFetchOnce(payload: unknown, ok = true, status = 200) {
	const fetchMock = vi.fn().mockResolvedValue({
		ok,
		status,
		json: async () => payload,
	} as Response);
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}

const apiMeeting = {
	meetingId: "cm1",
	meetingCode: "ABCD23",
	title: "Planning",
	roomName: "meeting-abcd23",
	status: "ended",
	joinable: false,
	owner: { id: "host_1", displayName: "Alice" },
	hostIdentity: "host_1",
	createdAt: "2026-06-12T01:00:00.000Z",
	startedAt: "2026-06-12T01:05:00.000Z",
	endingAt: null,
	endedAt: "2026-06-12T02:05:00.000Z",
};

describe("meetingApiMeetings", () => {
	beforeEach(() => vi.stubEnv("VITE_MEETING_API_BASE_URL", BASE));
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
		vi.resetModules();
	});

	it("listMeetings hits /meetings and maps to workbench Meeting", async () => {
		const fetchMock = mockFetchOnce([apiMeeting]);
		const adapter = await loadAdapter();

		const result = await adapter.listMeetings();
		expect(fetchMock).toHaveBeenCalledWith(`${BASE}/meetings`);
		expect(result).toEqual([
			{
				id: "ABCD23",
				title: "Planning",
				status: "ended",
				livekitRoomName: "meeting-abcd23",
				scheduledAt: undefined,
				startedAt: "2026-06-12T01:05:00.000Z",
				endedAt: "2026-06-12T02:05:00.000Z",
				durationMs: 3_600_000,
				updatedAt: "2026-06-12T02:05:00.000Z",
			},
		]);
	});

	it("getMeeting hits /meetings/:code with encoded id", async () => {
		const fetchMock = mockFetchOnce(apiMeeting);
		const adapter = await loadAdapter();
		await adapter.getMeeting("AB CD");
		expect(fetchMock).toHaveBeenCalledWith(`${BASE}/meetings/AB%20CD`);
	});

	it("maps created -> scheduled with scheduledAt set", async () => {
		mockFetchOnce({
			...apiMeeting,
			status: "created",
			startedAt: null,
			endedAt: null,
		});
		const adapter = await loadAdapter();
		const m = await adapter.getMeeting("X");
		expect(m.status).toBe("scheduled");
		expect(m.scheduledAt).toBe("2026-06-12T01:00:00.000Z");
	});

	it("createMeeting POSTs to /meetings with the body", async () => {
		const fetchMock = mockFetchOnce({ ...apiMeeting, status: "created" });
		const adapter = await loadAdapter();
		await adapter.createMeeting({ title: "New" });
		expect(fetchMock).toHaveBeenCalledWith(`${BASE}/meetings`, {
			method: "POST",
			body: JSON.stringify({ title: "New" }),
			headers: { "content-type": "application/json" },
		});
	});
});
