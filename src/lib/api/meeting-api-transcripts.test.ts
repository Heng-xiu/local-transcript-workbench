import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE = "http://localhost:4001/api";

/**
 * Imports the adapter fresh with `VITE_MEETING_API_BASE_URL` stubbed so the
 * module-level `env.meetingApiBaseUrl` snapshot reflects the test base URL.
 */
async function loadAdapter() {
	vi.resetModules();
	vi.stubEnv("VITE_MEETING_API_BASE_URL", BASE);
	return (await import("./meeting-api-transcripts")).meetingApiTranscripts;
}

describe("meetingApiTranscripts", () => {
	beforeEach(() => {
		vi.stubEnv("VITE_MEETING_API_BASE_URL", BASE);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
		vi.resetModules();
	});

	function mockFetchOnce(payload: unknown, ok = true, status = 200) {
		const fetchMock = vi.fn().mockResolvedValue({
			ok,
			status,
			json: async () => payload,
		} as Response);
		vi.stubGlobal("fetch", fetchMock);
		return fetchMock;
	}

	it("listTranscriptListItems hits /transcripts and parses the body", async () => {
		const items = [{ id: "t1" }];
		const fetchMock = mockFetchOnce(items);
		const adapter = await loadAdapter();

		await expect(adapter.listTranscriptListItems()).resolves.toEqual(items);
		expect(fetchMock).toHaveBeenCalledWith(`${BASE}/transcripts`);
	});

	it("getTranscript hits /transcripts/:id with an encoded id", async () => {
		const transcript = { id: "a b" };
		const fetchMock = mockFetchOnce(transcript);
		const adapter = await loadAdapter();

		await expect(adapter.getTranscript("a b")).resolves.toEqual(transcript);
		expect(fetchMock).toHaveBeenCalledWith(`${BASE}/transcripts/a%20b`);
	});

	it("getAudioSource hits /transcripts/:id/audio", async () => {
		const audio = {
			kind: "recording",
			url: null,
			durationSec: 1,
			simulated: true,
		};
		const fetchMock = mockFetchOnce(audio);
		const adapter = await loadAdapter();

		await expect(adapter.getAudioSource("t1")).resolves.toEqual(audio);
		expect(fetchMock).toHaveBeenCalledWith(`${BASE}/transcripts/t1/audio`);
	});

	it("listSegments hits /transcripts/:id/segments", async () => {
		const segments = [{ id: "s1" }];
		const fetchMock = mockFetchOnce(segments);
		const adapter = await loadAdapter();

		await expect(adapter.listSegments("t1")).resolves.toEqual(segments);
		expect(fetchMock).toHaveBeenCalledWith(`${BASE}/transcripts/t1/segments`);
	});

	it("builds the URL as base + path with no double slash", async () => {
		const fetchMock = mockFetchOnce([]);
		const adapter = await loadAdapter();

		await adapter.listTranscriptListItems();
		const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
		expect(calledUrl).toBe("http://localhost:4001/api/transcripts");
		expect(calledUrl).not.toContain("//transcripts");
	});

	it("throws `HTTP <status> for <path>` on a non-2xx response", async () => {
		mockFetchOnce(null, false, 503);
		const adapter = await loadAdapter();

		await expect(adapter.getTranscript("t1")).rejects.toThrow(
			"HTTP 503 for /transcripts/t1",
		);
	});
});
