/**
 * In-browser mock adapter for {@link WorkbenchApi}.
 *
 * Backs every call with the deterministic mock dataset, fake latency, simulated
 * streaming generation, and a real client-side DOCX/Markdown exporter. Edits
 * mutate the in-memory dataset so they persist for the session.
 */
import type { GeneratedOutput } from "@/features/ai/types";
import type {
	ExportFormat,
	ExportRequest,
	ExportResult,
} from "@/features/export/types";
import type { LiveKitConnectionInfo } from "@/features/livekit-placeholder/types";
import type { Project } from "@/features/projects/types";
import type { MeetingRecord } from "@/features/records/types";
import type { TranscriptSegment } from "@/features/segments/types";
import type {
	LocalIntegrationStatus,
	StorageStatus,
} from "@/features/settings/types";
import type { AudioSource, Transcript } from "@/features/transcripts/types";
import { env } from "@/lib/config/env";
import { buildDocxBlob } from "@/lib/docx";
import { mockDataset } from "@/lib/mock-data";
import { buildMockMarkdown } from "@/lib/mock-data/generators";
import { coerceTemplateId, OUTPUT_TEMPLATES } from "@/lib/mock-data/templates";
import {
	buildIntegrationStatuses,
	buildStorageStatus,
	workbenchData,
} from "@/lib/mock-data/workbench-fixtures";
import { delay, MockApiError, shouldSimulateSaveFailure } from "./latency";
import type {
	GenerateOptions,
	GenerateOutputInput,
	UpdateSegmentInput,
	WorkbenchApi,
} from "./types";

const MARKDOWN_MIME = "text/markdown;charset=utf-8";
const DOCX_MIME =
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function clone<T>(value: T): T {
	return structuredClone(value);
}

function nowIso(): string {
	return new Date().toISOString();
}

function requireProject(projectId: string): Project {
	const project = mockDataset.projectById.get(projectId);
	if (!project) throw new MockApiError(`Project not found: ${projectId}`);
	return project;
}

function requireTranscript(transcriptId: string): Transcript {
	const transcript = mockDataset.transcriptById.get(transcriptId);
	if (!transcript)
		throw new MockApiError(`Transcript not found: ${transcriptId}`);
	return transcript;
}

function requireSegments(transcriptId: string): TranscriptSegment[] {
	const segments = mockDataset.segmentsByTranscript.get(transcriptId);
	if (!segments)
		throw new MockApiError(`Segments not found for: ${transcriptId}`);
	return segments;
}

function modelForProvider(): string {
	return env.aiProviderMode === "openrouter"
		? "openrouter/anthropic/claude-3.5-sonnet"
		: "local/llama-3.1-8b-instruct";
}

function requireRecord(recordId: string): MeetingRecord {
	const record = workbenchData.recordById.get(recordId);
	if (!record) throw new MockApiError(`Record not found: ${recordId}`);
	return record;
}

/** Adapt a stored record into the `GeneratedOutput` shape the exporter expects. */
function recordToGeneratedOutput(record: MeetingRecord): GeneratedOutput {
	const transcript = mockDataset.transcriptById.get(record.transcriptId);
	return {
		id: `out_${record.id}`,
		projectId: transcript?.projectId ?? "",
		transcriptId: record.transcriptId,
		templateId: coerceTemplateId(record.templateId),
		provider: env.aiProviderMode,
		model: modelForProvider(),
		markdown: record.markdown ?? "",
		createdAt: record.updatedAt,
	};
}

export const mockApi: WorkbenchApi = {
	async listMeetings() {
		await delay(180);
		return clone(workbenchData.meetings);
	},

	async getMeeting(meetingId) {
		await delay(120);
		const meeting = workbenchData.meetingById.get(meetingId);
		if (!meeting) throw new MockApiError(`Meeting not found: ${meetingId}`);
		return clone(meeting);
	},

	async listTranscriptListItems() {
		await delay(180);
		return clone(workbenchData.transcriptListItems);
	},

	async listMeetingRecords() {
		await delay(180);
		return clone(workbenchData.records);
	},

	async getMeetingRecord(recordId) {
		await delay(120);
		return clone(requireRecord(recordId));
	},

	async generateMeetingRecord(transcriptId, templateId) {
		// Simulated backend generation job.
		await delay(950);
		if (workbenchData.generationFailingTranscriptIds.has(transcriptId)) {
			throw new MockApiError(
				"Record generation failed for this transcript. Retry to try again.",
			);
		}
		const transcript = requireTranscript(transcriptId);
		const project = requireProject(transcript.projectId);
		const segments = requireSegments(transcriptId);
		const safeTemplateId = coerceTemplateId(templateId);
		const markdown = buildMockMarkdown(safeTemplateId, {
			project,
			transcript,
			segments,
		});
		const now = nowIso();

		const existing = workbenchData.recordByTranscriptId.get(transcriptId);
		if (existing) {
			existing.status = "ready";
			existing.markdown = markdown;
			existing.templateId = safeTemplateId;
			existing.updatedAt = now;
			return clone(existing);
		}

		const meeting = workbenchData.meetingByTranscriptId.get(transcriptId);
		const record: MeetingRecord = {
			id: `rec_${transcriptId}`,
			meetingId: meeting?.id,
			transcriptId,
			title: `${project.name} — Meeting Record`,
			templateId: safeTemplateId,
			status: "ready",
			markdown,
			updatedAt: now,
		};
		workbenchData.records.push(record);
		workbenchData.recordById.set(record.id, record);
		workbenchData.recordByTranscriptId.set(transcriptId, record);
		if (meeting) meeting.recordId = record.id;
		return clone(record);
	},

	async exportMeetingRecord(
		recordId: string,
		format: ExportFormat,
	): Promise<ExportResult> {
		await delay(260);
		const record = requireRecord(recordId);
		if (!record.markdown) {
			throw new MockApiError("Record has no content to export yet.");
		}
		const filename = record.title;
		const now = nowIso();
		let result: ExportResult;
		if (format === "markdown") {
			result = {
				format: "markdown",
				filename: `${filename}.md`,
				mimeType: MARKDOWN_MIME,
				blob: new Blob([record.markdown], { type: MARKDOWN_MIME }),
			};
			record.exportedMarkdownAt = now;
		} else {
			result = {
				format: "docx",
				filename: `${filename}.docx`,
				mimeType: DOCX_MIME,
				blob: await buildDocxBlob(recordToGeneratedOutput(record)),
			};
			record.exportedDocxAt = now;
		}
		record.status = "exported";
		record.updatedAt = now;
		return result;
	},

	async getIntegrationStatuses(): Promise<LocalIntegrationStatus[]> {
		await delay(80);
		return clone(buildIntegrationStatuses());
	},

	async getStorageStatus(): Promise<StorageStatus> {
		await delay(80);
		return clone(buildStorageStatus());
	},

	async listProjects() {
		await delay(220);
		return clone(mockDataset.projects);
	},

	async getProject(projectId) {
		await delay(120);
		return clone(requireProject(projectId));
	},

	async getTranscript(transcriptId) {
		await delay(180);
		return clone(requireTranscript(transcriptId));
	},

	async getAudioSource(transcriptId): Promise<AudioSource> {
		await delay(100);
		return clone(requireTranscript(transcriptId).audio);
	},

	async listSegments(transcriptId) {
		// Larger transcripts take a touch longer, like a real paginated fetch.
		const segments = requireSegments(transcriptId);
		await delay(180 + Math.min(segments.length, 1500) * 0.15);
		return segments.map((s) => ({ ...s }));
	},

	async updateSegment(input: UpdateSegmentInput) {
		await delay(420);
		if (shouldSimulateSaveFailure(input.text)) {
			throw new MockApiError(
				"Simulated save failure (text contains the [[fail]] marker). Retry to recover.",
			);
		}
		const segments = requireSegments(input.transcriptId);
		const idx = segments.findIndex((s) => s.id === input.segmentId);
		if (idx === -1)
			throw new MockApiError(`Segment not found: ${input.segmentId}`);
		const updated: TranscriptSegment = {
			...segments[idx],
			text: input.text,
			revision: segments[idx].revision + 1,
			updatedAt: nowIso(),
		};
		segments[idx] = updated; // mutate in-memory store so edits persist
		const transcript = mockDataset.transcriptById.get(input.transcriptId);
		if (transcript) {
			transcript.revision += 1;
			transcript.updatedAt = updated.updatedAt;
		}
		return { ...updated };
	},

	async listTemplates() {
		await delay(60);
		return clone([...OUTPUT_TEMPLATES]);
	},

	async generateOutput(
		input: GenerateOutputInput,
		options: GenerateOptions = {},
	): Promise<GeneratedOutput> {
		const { signal, onToken } = options;
		const project = requireProject(input.projectId);
		const transcript = requireTranscript(input.transcriptId);
		const segments = requireSegments(input.transcriptId);

		// Queued phase.
		await delay(400, signal);

		const markdown = buildMockMarkdown(input.templateId, {
			project,
			transcript,
			segments,
		});

		// Simulated token streaming.
		if (onToken) {
			const tokens = markdown.match(/\S+\s*/g) ?? [markdown];
			let acc = "";
			for (let i = 0; i < tokens.length; i++) {
				acc += tokens[i];
				if (i % 3 === 0 || i === tokens.length - 1) {
					onToken(tokens[i], acc);
					await delay(14, signal);
				}
			}
		} else {
			await delay(900, signal);
		}

		return {
			id: `out_${input.templateId}_${Date.parse(nowIso())}`,
			projectId: input.projectId,
			transcriptId: input.transcriptId,
			templateId: input.templateId,
			provider: env.aiProviderMode,
			model: modelForProvider(),
			markdown,
			createdAt: nowIso(),
			usage: {
				promptTokens: Math.round(segments.length * 12.5),
				completionTokens: markdown.length,
			},
		};
	},

	async exportOutput(request: ExportRequest): Promise<ExportResult> {
		await delay(260);
		if (request.format === "markdown") {
			const blob = new Blob([request.output.markdown], {
				type: MARKDOWN_MIME,
			});
			return {
				format: "markdown",
				filename: `${request.filename}.md`,
				mimeType: MARKDOWN_MIME,
				blob,
			};
		}
		const blob = await buildDocxBlob(request.output);
		return {
			format: "docx",
			filename: `${request.filename}.docx`,
			mimeType: DOCX_MIME,
			blob,
		};
	},

	async getLiveKitConnection(projectId): Promise<LiveKitConnectionInfo> {
		await delay(80);
		const project = requireProject(projectId);
		const transcript = requireTranscript(project.transcriptId);
		return {
			state: "placeholder",
			wsUrl: env.livekitWsUrl || null,
			roomName: transcript.audio.livekit?.roomName ?? null,
			token: null,
			note: "LiveKit is not connected in the MVP. The self-hosted backend will mint a token and the client will join the room here.",
		};
	},
};
