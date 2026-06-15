import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE = "http://localhost:4001/api";

async function loadAdapter() {
	vi.resetModules();
	vi.stubEnv("VITE_MEETING_API_BASE_URL", BASE);
	const mod = await import("./meeting-api-records");
	return {
		adapter: mod.meetingApiRecords,
		fetchMarkdown: mod.fetchRecordVersionMarkdown,
	};
}

describe("meetingApiRecords", () => {
	beforeEach(() => {
		vi.stubEnv("VITE_MEETING_API_BASE_URL", BASE);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
		vi.resetModules();
	});

	function mockFetchSequence(
		responses: Array<{ payload: unknown; ok?: boolean; status?: number }>,
	) {
		let call = 0;
		const fetchMock = vi.fn().mockImplementation(() => {
			const r = responses[call++] ?? { payload: null, ok: false, status: 500 };
			return Promise.resolve({
				ok: r.ok ?? true,
				status: r.status ?? 200,
				json: async () => r.payload,
			} as Response);
		});
		vi.stubGlobal("fetch", fetchMock);
		return fetchMock;
	}

	const readySummary = {
		id: "rec-1",
		meetingId: "meet-1",
		transcriptId: "tr-1",
		templateId: "tmpl-standard",
		title: "Weekly Sync",
		status: "ready" as const,
		latestVersion: 2,
		failureReason: null,
		updatedAt: "2026-06-15T10:00:00.000Z",
		versions: [
			{
				id: "ver-1",
				version: 1,
				templateId: "tmpl-standard",
				model: "mistral-7b",
				createdAt: "2026-06-15T09:00:00.000Z",
				promptTokens: 500,
				completionTokens: 300,
			},
			{
				id: "ver-2",
				version: 2,
				templateId: "tmpl-standard",
				model: "mistral-7b",
				createdAt: "2026-06-15T10:00:00.000Z",
				promptTokens: 510,
				completionTokens: 310,
			},
		],
	};

	const versionContent = {
		version: 2,
		templateId: "tmpl-standard",
		model: "mistral-7b",
		createdAt: "2026-06-15T10:00:00.000Z",
		markdown: "# Weekly Sync\n\nAction items...",
	};

	it("generateMeetingRecord POSTs to /transcripts/:id/records with templateId", async () => {
		const fetchMock = mockFetchSequence([
			{ payload: readySummary },
			{ payload: versionContent },
		]);
		const { adapter } = await loadAdapter();

		await adapter.generateMeetingRecord("tr-1", "tmpl-standard");

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			`${BASE}/transcripts/tr-1/records`,
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ templateId: "tmpl-standard" }),
				headers: expect.objectContaining({
					"content-type": "application/json",
				}),
			}),
		);
	});

	it("generateMeetingRecord fetches version content when status is ready", async () => {
		const fetchMock = mockFetchSequence([
			{ payload: readySummary },
			{ payload: versionContent },
		]);
		const { adapter } = await loadAdapter();

		const result = await adapter.generateMeetingRecord("tr-1", "tmpl-standard");

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			`${BASE}/records/rec-1/versions/2`,
		);
		expect(result.markdown).toBe("# Weekly Sync\n\nAction items...");
	});

	it("generateMeetingRecord maps versions and latestVersion", async () => {
		mockFetchSequence([{ payload: readySummary }, { payload: versionContent }]);
		const { adapter } = await loadAdapter();

		const result = await adapter.generateMeetingRecord("tr-1", "tmpl-standard");

		expect(result.latestVersion).toBe(2);
		expect(result.versions).toHaveLength(2);
		expect(result.versions?.[0]).toMatchObject({
			id: "ver-1",
			version: 1,
			model: "mistral-7b",
			promptTokens: 500,
			completionTokens: 300,
		});
	});

	it("generateMeetingRecord with status failed: no second fetch, markdown undefined, status fails through", async () => {
		const failedSummary = {
			...readySummary,
			status: "failed" as const,
			latestVersion: 0,
			versions: [],
		};
		const fetchMock = mockFetchSequence([{ payload: failedSummary }]);
		const { adapter } = await loadAdapter();

		const result = await adapter.generateMeetingRecord("tr-1", "tmpl-standard");

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(result.markdown).toBeUndefined();
		expect(result.status).toBe("failed");
	});

	it("generateMeetingRecord encodes transcriptId in the path", async () => {
		const fetchMock = mockFetchSequence([
			{
				payload: {
					...readySummary,
					status: "generating" as const,
					latestVersion: 0,
					versions: [],
				},
			},
		]);
		const { adapter } = await loadAdapter();

		await adapter.generateMeetingRecord("tr id/1", "tmpl-standard");

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE}/transcripts/tr%20id%2F1/records`,
			expect.anything(),
		);
	});

	it("fetchRecordVersionMarkdown GETs /records/:id/versions/:n and returns markdown", async () => {
		const fetchMock = mockFetchSequence([{ payload: versionContent }]);
		const { fetchMarkdown } = await loadAdapter();

		const markdown = await fetchMarkdown("rec-1", 2);

		expect(fetchMock).toHaveBeenCalledWith(`${BASE}/records/rec-1/versions/2`);
		expect(markdown).toBe("# Weekly Sync\n\nAction items...");
	});

	it("fetchRecordVersionMarkdown encodes recordId in the path", async () => {
		const fetchMock = mockFetchSequence([{ payload: versionContent }]);
		const { fetchMarkdown } = await loadAdapter();

		await fetchMarkdown("rec id 1", 3);

		expect(fetchMock).toHaveBeenCalledWith(
			`${BASE}/records/rec%20id%201/versions/3`,
		);
	});

	it("throws HTTP error on non-2xx response", async () => {
		mockFetchSequence([{ payload: null, ok: false, status: 500 }]);
		const { adapter } = await loadAdapter();

		await expect(
			adapter.generateMeetingRecord("tr-1", "tmpl-standard"),
		).rejects.toThrow("HTTP 500 for /transcripts/tr-1/records");
	});
});
