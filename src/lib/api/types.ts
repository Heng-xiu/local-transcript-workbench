/**
 * The Workbench API port.
 *
 * This is the single seam between the UI and any backend. The MVP ships a
 * `mockApi` adapter (in-browser, fake latency); the self-hosted backend will
 * ship an `httpApi` adapter that implements the exact same interface. Swapping
 * backends is therefore a one-line change in `lib/api/index.ts` — no feature or
 * component code changes.
 */
import type { GeneratedOutput, OutputTemplate } from "@/features/ai/types";
import type {
	ExportFormat,
	ExportRequest,
	ExportResult,
} from "@/features/export/types";
import type { LiveKitConnectionInfo } from "@/features/livekit-placeholder/types";
import type { Meeting } from "@/features/meetings/types";
import type { Project } from "@/features/projects/types";
import type { MeetingRecord } from "@/features/records/types";
import type { TranscriptSegment } from "@/features/segments/types";
import type {
	LocalIntegrationStatus,
	StorageStatus,
} from "@/features/settings/types";
import type {
	AudioSource,
	Transcript,
	TranscriptListItem,
} from "@/features/transcripts/types";

export interface UpdateSegmentInput {
	transcriptId: string;
	segmentId: string;
	text: string;
	/** Revision the edit is based on, for optimistic-concurrency checks. */
	baseRevision: number;
}

export interface CreateMeetingInput {
	/** Optional title; backend falls back to the generated meeting code. */
	title?: string;
	/** Optional owner display name; backend defaults to "Local Host". */
	ownerDisplayName?: string;
}

export interface GenerateOutputInput {
	projectId: string;
	transcriptId: string;
	templateId: OutputTemplate["id"];
}

export interface GenerateOptions {
	/** Abort an in-flight generation job. */
	signal?: AbortSignal;
	/** Receives incremental Markdown chunks for streaming display. */
	onToken?: (chunk: string, fullText: string) => void;
}

export interface WorkbenchApi {
	// --- Meetings (LiveKit-backed session history) ---------------------------
	listMeetings(): Promise<Meeting[]>;
	getMeeting(meetingId: string): Promise<Meeting>;
	createMeeting(input?: CreateMeetingInput): Promise<Meeting>;

	// --- Transcripts ---------------------------------------------------------
	/** Lightweight list for the Transcripts section (status + relationships). */
	listTranscriptListItems(): Promise<TranscriptListItem[]>;
	getTranscript(transcriptId: string): Promise<Transcript>;
	getAudioSource(transcriptId: string): Promise<AudioSource>;
	listSegments(transcriptId: string): Promise<TranscriptSegment[]>;
	updateSegment(input: UpdateSegmentInput): Promise<TranscriptSegment>;

	// --- Meeting records (formal deliverable) --------------------------------
	listMeetingRecords(): Promise<MeetingRecord[]>;
	getMeetingRecord(recordId: string): Promise<MeetingRecord>;
	/** Generate (or regenerate) the record for a transcript. */
	generateMeetingRecord(
		transcriptId: string,
		templateId: string,
	): Promise<MeetingRecord>;
	/**
	 * Export a record as Markdown or DOCX. Returns the produced blob so the
	 * browser download + cache update stay on the clean side of the seam (a real
	 * backend `/records/:id/export` returns the file the same way). Marks the
	 * record `exported` and stamps the matching `exported*At`.
	 */
	exportMeetingRecord(
		recordId: string,
		format: ExportFormat,
	): Promise<ExportResult>;

	// --- Projects (optional grouping metadata; not a primary nav section) ----
	listProjects(): Promise<Project[]>;
	getProject(projectId: string): Promise<Project>;

	// --- AI generation (transcript-side draft output) ------------------------
	listTemplates(): Promise<OutputTemplate[]>;
	generateOutput(
		input: GenerateOutputInput,
		options?: GenerateOptions,
	): Promise<GeneratedOutput>;

	exportOutput(request: ExportRequest): Promise<ExportResult>;

	// --- Settings / local integration status ---------------------------------
	getIntegrationStatuses(): Promise<LocalIntegrationStatus[]>;
	getStorageStatus(): Promise<StorageStatus>;

	/** LiveKit placeholder — returns connection metadata, never connects. */
	getLiveKitConnection(projectId: string): Promise<LiveKitConnectionInfo>;
}
