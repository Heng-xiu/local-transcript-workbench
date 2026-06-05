import { describe, expect, it } from "vitest";
import { mockApi } from "@/lib/api/mock-api";

describe("mockApi meetings", () => {
	it("lists meetings spanning scheduled / live / ended", async () => {
		const meetings = await mockApi.listMeetings();
		const statuses = new Set(meetings.map((m) => m.status));
		expect(statuses.has("scheduled")).toBe(true);
		expect(statuses.has("live")).toBe(true);
		expect(statuses.has("ended")).toBe(true);
	});

	it("gets a single meeting and links a transcript", async () => {
		const meetings = await mockApi.listMeetings();
		const ended = meetings.find((m) => m.status === "ended");
		expect(ended).toBeDefined();
		const meeting = await mockApi.getMeeting(ended?.id ?? "");
		expect(meeting.id).toBe(ended?.id);
		expect(meeting.transcriptId).toBeTruthy();
	});
});

describe("mockApi transcript list items", () => {
	it("covers processing / ready_for_edit / failed", async () => {
		const items = await mockApi.listTranscriptListItems();
		const statuses = new Set(items.map((t) => t.status));
		expect(statuses.has("processing")).toBe(true);
		expect(statuses.has("ready_for_edit")).toBe(true);
		expect(statuses.has("failed")).toBe(true);
	});
});

describe("mockApi meeting records", () => {
	it("covers every record status", async () => {
		const records = await mockApi.listMeetingRecords();
		const statuses = new Set(records.map((r) => r.status));
		for (const expected of [
			"not_started",
			"generating",
			"ready",
			"failed",
			"exported",
		]) {
			expect(statuses.has(expected as never)).toBe(true);
		}
	});

	it("generates a record from a transcript", async () => {
		const items = await mockApi.listTranscriptListItems();
		const ready = items.find((t) => t.status === "ready_for_edit");
		const record = await mockApi.generateMeetingRecord(
			ready?.id ?? "",
			"meeting-summary",
		);
		expect(record.status).toBe("ready");
		expect(record.markdown?.length ?? 0).toBeGreaterThan(0);
	});

	it("fails generation deterministically for the problematic transcript", async () => {
		const records = await mockApi.listMeetingRecords();
		const failed = records.find((r) => r.status === "failed");
		expect(failed).toBeDefined();
		await expect(
			mockApi.generateMeetingRecord(
				failed?.transcriptId ?? "",
				"action-items",
			),
		).rejects.toThrow();
	});

	it("exports a record as a real DOCX blob and marks it exported", async () => {
		const records = await mockApi.listMeetingRecords();
		const ready = records.find((r) => r.status === "ready");
		expect(ready).toBeDefined();
		const result = await mockApi.exportMeetingRecord(ready?.id ?? "", "docx");
		expect(result.format).toBe("docx");
		expect(result.filename.endsWith(".docx")).toBe(true);
		expect(result.blob.size).toBeGreaterThan(0);

		const updated = await mockApi.getMeetingRecord(ready?.id ?? "");
		expect(updated.status).toBe("exported");
		expect(updated.exportedDocxAt).toBeTruthy();
	});
});

describe("mockApi settings", () => {
	it("returns integration statuses for the expected kinds", async () => {
		const statuses = await mockApi.getIntegrationStatuses();
		const kinds = new Set(statuses.map((s) => s.kind));
		for (const kind of [
			"api",
			"livekit",
			"llm",
			"openrouter",
			"storage",
			"export",
		]) {
			expect(kinds.has(kind as never)).toBe(true);
		}
		// Never leaks secret values — only env var *names*.
		for (const s of statuses) {
			for (const name of s.envVars) expect(name.startsWith("VITE_")).toBe(true);
		}
	});

	it("returns a storage status with a used <= total invariant", async () => {
		const storage = await mockApi.getStorageStatus();
		expect(storage.totalBytes).toBeGreaterThan(0);
		expect(storage.usedBytes).toBeLessThanOrEqual(storage.totalBytes);
		expect(storage.usedBytes).toBe(
			storage.recordingBytes + storage.transcriptBytes + storage.exportBytes,
		);
	});
});
