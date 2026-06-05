/** Lifecycle state of a project, mirroring the future backend's job pipeline. */
export type ProjectStatus =
	| "recording"
	| "processing"
	| "ready"
	| "archived"
	| "error";

/**
 * A project is the top-level unit shown in the left sidebar: one recording
 * session and its derived transcript.
 */
export interface Project {
	id: string;
	name: string;
	status: ProjectStatus;
	/** ISO 8601 timestamps. */
	createdAt: string;
	updatedAt: string;
	/** Total audio duration in seconds. */
	durationSec: number;
	/** BCP-47 language tag, e.g. "en", "zh-Hant". */
	language: string;
	speakerCount: number;
	segmentCount: number;
	/** The transcript produced for this project (1:1 in the MVP). */
	transcriptId: string;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
	recording: "Recording",
	processing: "Processing",
	ready: "Ready",
	archived: "Archived",
	error: "Error",
};
