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
import type { ExportRequest, ExportResult } from "@/features/export/types";
import type { LiveKitConnectionInfo } from "@/features/livekit-placeholder/types";
import type { Project } from "@/features/projects/types";
import type { TranscriptSegment } from "@/features/segments/types";
import type { AudioSource, Transcript } from "@/features/transcripts/types";

export interface UpdateSegmentInput {
	transcriptId: string;
	segmentId: string;
	text: string;
	/** Revision the edit is based on, for optimistic-concurrency checks. */
	baseRevision: number;
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
	listProjects(): Promise<Project[]>;
	getProject(projectId: string): Promise<Project>;

	getTranscript(transcriptId: string): Promise<Transcript>;
	getAudioSource(transcriptId: string): Promise<AudioSource>;
	listSegments(transcriptId: string): Promise<TranscriptSegment[]>;
	updateSegment(input: UpdateSegmentInput): Promise<TranscriptSegment>;

	listTemplates(): Promise<OutputTemplate[]>;
	generateOutput(
		input: GenerateOutputInput,
		options?: GenerateOptions,
	): Promise<GeneratedOutput>;

	exportOutput(request: ExportRequest): Promise<ExportResult>;

	/** LiveKit placeholder — returns connection metadata, never connects. */
	getLiveKitConnection(projectId: string): Promise<LiveKitConnectionInfo>;
}
