import { beforeEach, describe, expect, it } from "vitest";
import { mockApi } from "@/lib/api/mock-api";
import { FAILURE_MARKER } from "@/lib/api/latency";

async function firstTranscriptId(): Promise<string> {
	const projects = await mockApi.listProjects();
	return projects[0].transcriptId;
}

describe("mockApi reads", () => {
	it("lists projects", async () => {
		const projects = await mockApi.listProjects();
		expect(projects.length).toBeGreaterThan(0);
		expect(projects[0]).toHaveProperty("transcriptId");
	});

	it("loads a transcript and its segments", async () => {
		const transcriptId = await firstTranscriptId();
		const transcript = await mockApi.getTranscript(transcriptId);
		const segments = await mockApi.listSegments(transcriptId);
		expect(transcript.id).toBe(transcriptId);
		expect(segments.length).toBe(transcript.segmentIds.length);
	});

	it("exposes the four templates", async () => {
		const templates = await mockApi.listTemplates();
		expect(templates.map((t) => t.id).sort()).toEqual(
			["action-items", "interview-notes", "meeting-summary", "sales-call-notes"].sort(),
		);
	});
});

describe("mockApi.updateSegment", () => {
	let transcriptId: string;
	let segmentId: string;
	let baseRevision: number;

	beforeEach(async () => {
		transcriptId = await firstTranscriptId();
		const segments = await mockApi.listSegments(transcriptId);
		segmentId = segments[0].id;
		baseRevision = segments[0].revision;
	});

	it("persists an edit and bumps the revision", async () => {
		const updated = await mockApi.updateSegment({
			transcriptId,
			segmentId,
			text: "Edited text.",
			baseRevision,
		});
		expect(updated.text).toBe("Edited text.");
		expect(updated.revision).toBe(baseRevision + 1);

		const reread = await mockApi.listSegments(transcriptId);
		expect(reread.find((s) => s.id === segmentId)?.text).toBe("Edited text.");
	});

	it("fails when the text contains the failure marker", async () => {
		await expect(
			mockApi.updateSegment({
				transcriptId,
				segmentId,
				text: `boom ${FAILURE_MARKER}`,
				baseRevision,
			}),
		).rejects.toThrow();
	});
});

describe("mockApi.generateOutput", () => {
	it("streams and returns grounded markdown", async () => {
		const projects = await mockApi.listProjects();
		const project = projects[0];
		const chunks: string[] = [];
		const output = await mockApi.generateOutput(
			{
				projectId: project.id,
				transcriptId: project.transcriptId,
				templateId: "meeting-summary",
			},
			{ onToken: (chunk) => chunks.push(chunk) },
		);
		expect(chunks.length).toBeGreaterThan(0);
		expect(output.markdown).toContain(project.name);
		expect(output.provider).toBe("local");
	});
});

describe("mockApi.exportOutput", () => {
	const baseOutput = {
		id: "out_1",
		projectId: "p",
		transcriptId: "t",
		templateId: "meeting-summary" as const,
		provider: "local" as const,
		model: "local/test",
		markdown: "# Title\n\n- one\n- two",
		createdAt: "2026-06-04T00:00:00.000Z",
	};

	it("exports markdown", async () => {
		const result = await mockApi.exportOutput({
			format: "markdown",
			filename: "notes",
			output: baseOutput,
		});
		expect(result.filename).toBe("notes.md");
		expect(result.blob.size).toBeGreaterThan(0);
	});

	it("exports a real docx blob", async () => {
		const result = await mockApi.exportOutput({
			format: "docx",
			filename: "notes",
			output: baseOutput,
		});
		expect(result.filename).toBe("notes.docx");
		expect(result.blob.size).toBeGreaterThan(0);
	});
});
