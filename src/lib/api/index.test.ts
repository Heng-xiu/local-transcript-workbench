import { afterEach, describe, expect, it, vi } from "vitest";

const READ_METHODS = [
	"listTranscriptListItems",
	"getTranscript",
	"getAudioSource",
	"listSegments",
] as const;

/** Load `api` (and the adapters it composes) fresh under the current env. */
async function loadModules() {
	vi.resetModules();
	const { api } = await import("./index");
	const { mockApi } = await import("./mock-api");
	const { meetingApiTranscripts } = await import("./meeting-api-transcripts");
	const { meetingApiMeetings } = await import("./meeting-api-meetings");
	const { meetingApiRecords } = await import("./meeting-api-records");
	return {
		api,
		mockApi,
		meetingApiTranscripts,
		meetingApiMeetings,
		meetingApiRecords,
	};
}

describe("api adapter composition", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.resetModules();
	});

	it("with no meeting-api base URL, all four reads come from the base (mock)", async () => {
		vi.stubEnv("VITE_API_BASE_URL", "");
		vi.stubEnv("VITE_MEETING_API_BASE_URL", "");
		const { api, mockApi } = await loadModules();

		for (const method of READ_METHODS) {
			expect(api[method]).toBe(mockApi[method]);
		}
		// updateSegment also stays on the mock base.
		expect(api.updateSegment).toBe(mockApi.updateSegment);
		// Meetings methods also stay on the mock base.
		for (const m of ["listMeetings", "getMeeting", "createMeeting"] as const) {
			expect(api[m]).toBe(mockApi[m]);
		}
	});

	it("with meeting-api base URL set, the four reads and updateSegment come from meeting-api", async () => {
		vi.stubEnv("VITE_API_BASE_URL", "");
		vi.stubEnv("VITE_MEETING_API_BASE_URL", "http://localhost:4001/api");
		const {
			api,
			mockApi,
			meetingApiTranscripts,
			meetingApiMeetings,
			meetingApiRecords,
		} = await loadModules();

		for (const method of READ_METHODS) {
			expect(api[method]).toBe(meetingApiTranscripts[method]);
			expect(api[method]).not.toBe(mockApi[method]);
		}
		// Segment edit (plan 017) now persists through meeting-api too.
		expect(api.updateSegment).toBe(meetingApiTranscripts.updateSegment);
		expect(api.updateSegment).not.toBe(mockApi.updateSegment);
		// Meetings methods now come from meetingApiMeetings (plan 020).
		for (const m of ["listMeetings", "getMeeting", "createMeeting"] as const) {
			expect(api[m]).toBe(meetingApiMeetings[m]);
			expect(api[m]).not.toBe(mockApi[m]);
		}
		// generateMeetingRecord now comes from meetingApiRecords (plan 022).
		expect(api.generateMeetingRecord).toBe(
			meetingApiRecords.generateMeetingRecord,
		);
		expect(api.generateMeetingRecord).not.toBe(mockApi.generateMeetingRecord);
		// Non-transcript, non-meeting, non-records methods are untouched.
		expect(api.listMeetingRecords).toBe(mockApi.listMeetingRecords);
	});

	it("without meeting-api base URL, generateMeetingRecord comes from the base (mock)", async () => {
		vi.stubEnv("VITE_API_BASE_URL", "");
		vi.stubEnv("VITE_MEETING_API_BASE_URL", "");
		const { api, mockApi } = await loadModules();

		expect(api.generateMeetingRecord).toBe(mockApi.generateMeetingRecord);
	});
});
