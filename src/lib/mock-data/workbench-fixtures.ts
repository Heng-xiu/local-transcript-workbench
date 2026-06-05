/**
 * Meeting / Transcript-status / Record mock layer.
 *
 * Built on top of the existing {@link mockDataset} (projects + transcripts +
 * segments) so that `ready_for_edit` transcripts open the *real* virtualised
 * editor with real segments. This file derives the session/record domain and
 * the relationships between meetings, transcripts, and records, covering every
 * MVP status so the UI can be exercised end-to-end against the mock API.
 */
import type { OutputTemplateId } from "@/features/ai/types";
import type { Meeting, MeetingStatus } from "@/features/meetings/types";
import type {
	MeetingRecord,
	MeetingRecordStatus,
} from "@/features/records/types";
import type {
	LocalIntegrationStatus,
	StorageStatus,
} from "@/features/settings/types";
import type { TranscriptListItem } from "@/features/transcripts/types";
import { env } from "@/lib/config/env";
import { buildMockMarkdown } from "./generators";
import { mockDataset } from "./index";
import { templateName } from "./templates";

interface WorkbenchSpec {
	slug: string;
	meetingStatus: MeetingStatus;
	transcriptStatus: TranscriptListItem["status"];
	/** Undefined => no record exists for this transcript yet. */
	recordStatus?: MeetingRecordStatus;
	templateId: OutputTemplateId;
}

/**
 * Explicit relationships for the eight seeded projects. Chosen so the dataset
 * contains: a live meeting + a scheduled meeting (below) + ended meetings; a
 * processing transcript, a failed transcript, and several ready ones; and
 * records spanning not_started / generating / ready / failed / exported.
 */
const WORKBENCH_SPECS: readonly WorkbenchSpec[] = [
	{
		slug: "q3-strategy",
		meetingStatus: "ended",
		transcriptStatus: "ready_for_edit",
		recordStatus: "ready",
		templateId: "meeting-summary",
	},
	{
		slug: "acme-discovery",
		meetingStatus: "ended",
		transcriptStatus: "ready_for_edit",
		recordStatus: "exported",
		templateId: "sales-call-notes",
	},
	{
		slug: "onboarding-interview",
		meetingStatus: "ended",
		transcriptStatus: "ready_for_edit",
		recordStatus: "not_started",
		templateId: "interview-notes",
	},
	{
		slug: "eng-standup",
		meetingStatus: "ended",
		transcriptStatus: "processing",
		templateId: "meeting-summary",
	},
	{
		slug: "fy26-board",
		meetingStatus: "ended",
		transcriptStatus: "ready_for_edit",
		recordStatus: "generating",
		templateId: "meeting-summary",
	},
	{
		slug: "sprint-retro",
		meetingStatus: "ended",
		transcriptStatus: "ready_for_edit",
		recordStatus: "failed",
		templateId: "action-items",
	},
	{
		slug: "weekly-1on1",
		meetingStatus: "live",
		transcriptStatus: "processing",
		templateId: "meeting-summary",
	},
	{
		slug: "podcast-ep12",
		meetingStatus: "ended",
		transcriptStatus: "failed",
		templateId: "interview-notes",
	},
] as const;

/** Future, not-yet-started session with no transcript/record yet. */
const SCHEDULED_MEETING: Meeting = {
	id: "mtg_advisory-board",
	title: "Customer Advisory Board — Kickoff",
	status: "scheduled",
	livekitRoomName: "advisory-board-room",
	scheduledAt: "2026-06-09T15:00:00.000Z",
	projectName: "Customer Advisory Board",
	updatedAt: "2026-06-03T12:00:00.000Z",
};

export interface WorkbenchMockData {
	meetings: Meeting[];
	meetingById: Map<string, Meeting>;
	meetingByTranscriptId: Map<string, Meeting>;
	transcriptListItems: TranscriptListItem[];
	transcriptStatusById: Map<string, TranscriptListItem["status"]>;
	records: MeetingRecord[];
	recordById: Map<string, MeetingRecord>;
	recordByTranscriptId: Map<string, MeetingRecord>;
	/** Transcripts whose record generation deterministically fails (demo/retry). */
	generationFailingTranscriptIds: Set<string>;
}

function buildWorkbenchData(): WorkbenchMockData {
	const meetings: Meeting[] = [];
	const meetingById = new Map<string, Meeting>();
	const meetingByTranscriptId = new Map<string, Meeting>();
	const transcriptListItems: TranscriptListItem[] = [];
	const transcriptStatusById = new Map<string, TranscriptListItem["status"]>();
	const records: MeetingRecord[] = [];
	const recordById = new Map<string, MeetingRecord>();
	const recordByTranscriptId = new Map<string, MeetingRecord>();
	const generationFailingTranscriptIds = new Set<string>();

	for (const spec of WORKBENCH_SPECS) {
		const projectId = `proj_${spec.slug}`;
		const transcriptId = `tr_${spec.slug}`;
		const project = mockDataset.projectById.get(projectId);
		const transcript = mockDataset.transcriptById.get(transcriptId);
		if (!project || !transcript) continue;

		const meetingId = `mtg_${spec.slug}`;
		const recordId = spec.recordStatus ? `rec_${spec.slug}` : undefined;
		const durationMs = transcript.audio.durationSec * 1000;
		const isEnded = spec.meetingStatus === "ended";

		const meeting: Meeting = {
			id: meetingId,
			title: project.name,
			status: spec.meetingStatus,
			livekitRoomName:
				transcript.audio.livekit?.roomName ?? `${spec.slug}-room`,
			startedAt: transcript.createdAt,
			endedAt: isEnded ? transcript.updatedAt : undefined,
			durationMs: isEnded ? durationMs : undefined,
			recordingAssetId: isEnded ? `asset_${spec.slug}` : undefined,
			transcriptId,
			recordId,
			projectName: project.name,
			updatedAt: transcript.updatedAt,
		};
		meetings.push(meeting);
		meetingById.set(meetingId, meeting);
		meetingByTranscriptId.set(transcriptId, meeting);

		transcriptStatusById.set(transcriptId, spec.transcriptStatus);
		transcriptListItems.push({
			id: transcriptId,
			meetingId,
			recordId,
			title: `${project.name} — Transcript`,
			status: spec.transcriptStatus,
			durationMs,
			updatedAt: transcript.updatedAt,
		});

		if (spec.recordStatus && recordId) {
			const hasContent =
				spec.recordStatus === "ready" || spec.recordStatus === "exported";
			const segments = mockDataset.segmentsByTranscript.get(transcriptId) ?? [];
			const markdown = hasContent
				? buildMockMarkdown(spec.templateId, { project, transcript, segments })
				: undefined;
			const record: MeetingRecord = {
				id: recordId,
				meetingId,
				transcriptId,
				title: `${project.name} — ${templateName(spec.templateId)}`,
				templateId: spec.templateId,
				status: spec.recordStatus,
				markdown,
				exportedDocxAt:
					spec.recordStatus === "exported" ? transcript.updatedAt : undefined,
				updatedAt: transcript.updatedAt,
			};
			records.push(record);
			recordById.set(recordId, record);
			recordByTranscriptId.set(transcriptId, record);
		}

		if (spec.recordStatus === "failed") {
			// The problematic recording keeps failing generation, so the failed
			// record's "Retry" deterministically reproduces the failure state.
			generationFailingTranscriptIds.add(transcriptId);
		}
	}

	meetings.unshift(SCHEDULED_MEETING);
	meetingById.set(SCHEDULED_MEETING.id, SCHEDULED_MEETING);

	return {
		meetings,
		meetingById,
		meetingByTranscriptId,
		transcriptListItems,
		transcriptStatusById,
		records,
		recordById,
		recordByTranscriptId,
		generationFailingTranscriptIds,
	};
}

/** Module-singleton — built once, mutated in-session by the mock API. */
export const workbenchData: WorkbenchMockData = buildWorkbenchData();

const GIB = 1024 ** 3;

/**
 * Read-only integration status cards derived from `VITE_*` configuration.
 * Reflects only whether an endpoint is configured — never any secret value.
 */
export function buildIntegrationStatuses(): LocalIntegrationStatus[] {
	const configured = (value: string): LocalIntegrationStatus["status"] =>
		value.length > 0 ? "configured" : "placeholder";

	return [
		{
			id: "api",
			name: "Local backend API",
			kind: "api",
			status: env.apiBaseUrl ? "configured" : "placeholder",
			description: env.useMockApi
				? "Running against the in-browser mock API. Set VITE_API_BASE_URL to switch to the self-hosted backend."
				: "Connected to the self-hosted backend.",
			envVars: ["VITE_API_BASE_URL"],
			details: {
				mode: env.useMockApi ? "mock" : "live",
				baseUrl: env.apiBaseUrl || "(mock)",
			},
		},
		{
			id: "livekit-server",
			name: "Local LiveKit server URL",
			kind: "livekit",
			status: configured(env.livekitWsUrl),
			description:
				"Signalling WebSocket for local meeting sessions. Placeholder only; the MVP never opens a connection.",
			envVars: ["VITE_LIVEKIT_WS_URL"],
			details: { wsUrl: env.livekitWsUrl || "(not set)" },
		},
		{
			id: "livekit-token",
			name: "LiveKit token endpoint",
			kind: "livekit",
			status: configured(env.livekitTokenEndpoint),
			description:
				"Backend endpoint that mints short-lived LiveKit access tokens. Tokens are never minted in the frontend.",
			envVars: ["VITE_LIVEKIT_TOKEN_ENDPOINT"],
			details: { endpoint: env.livekitTokenEndpoint || "(not set)" },
		},
		{
			id: "llm",
			name: "Local LLM provider",
			kind: "llm",
			status:
				env.aiProviderMode === "local"
					? configured(env.aiGenerationEndpoint)
					: "placeholder",
			description:
				"Record generation runs as a backend job. Provider selection and all API keys live in the backend, never the frontend.",
			envVars: ["VITE_AI_PROVIDER_MODE", "VITE_AI_GENERATION_ENDPOINT"],
			details: {
				providerMode: env.aiProviderMode,
				endpoint: env.aiGenerationEndpoint || "(not set)",
			},
		},
		{
			id: "llm-model",
			name: "Local model version",
			kind: "llm",
			status: "placeholder",
			description:
				"The model the backend uses for generation (display only in the MVP).",
			envVars: [],
			details: {
				model:
					env.aiProviderMode === "openrouter"
						? "openrouter/anthropic/claude-3.5-sonnet"
						: "local/llama-3.1-8b-instruct",
			},
		},
		{
			id: "openrouter",
			name: "OpenRouter mode (backend only)",
			kind: "openrouter",
			status:
				env.aiProviderMode === "openrouter" ? "configured" : "placeholder",
			description:
				"Optional. When enabled, the backend proxies generation through OpenRouter. The frontend only displays the mode; no keys are exposed.",
			envVars: ["VITE_AI_PROVIDER_MODE"],
			details: { active: env.aiProviderMode === "openrouter" },
		},
		{
			id: "storage",
			name: "Recording storage",
			kind: "storage",
			status: configured(env.recordingAssetEndpoint),
			description:
				"Backend endpoint that streams recording audio assets. Unused while mocking.",
			envVars: ["VITE_RECORDING_ASSET_ENDPOINT"],
			details: { endpoint: env.recordingAssetEndpoint || "(not set)" },
		},
		{
			id: "export-markdown",
			name: "Markdown export",
			kind: "export",
			status: "configured",
			description: "Markdown export runs entirely in the browser.",
			envVars: [],
		},
		{
			id: "export-docx",
			name: "DOCX export",
			kind: "export",
			status: "configured",
			description:
				"DOCX export runs entirely in the browser via the docx library.",
			envVars: [],
		},
	];
}

/**
 * Mock storage usage. NOTE: these are placeholder values. Real storage
 * capacity/usage must come from a backend endpoint (`GET /system/storage`)
 * once the self-hosted backend exposes it.
 */
export function buildStorageStatus(): StorageStatus {
	const recordingBytes = Math.round(58.4 * GIB);
	const transcriptBytes = Math.round(2.1 * GIB);
	const exportBytes = Math.round(0.6 * GIB);
	return {
		totalBytes: 256 * GIB,
		recordingBytes,
		transcriptBytes,
		exportBytes,
		usedBytes: recordingBytes + transcriptBytes + exportBytes,
	};
}
