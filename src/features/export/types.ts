import type { GeneratedOutput } from "@/features/ai/types";

export type ExportFormat = "markdown" | "docx";

/**
 * Simple, UI-facing export lifecycle. Derived from the export mutation state
 * (idle → exporting → exported, or failed) and shown next to the export action.
 */
export type ExportStatus = "idle" | "exporting" | "exported" | "failed";

export interface ExportRequest {
	format: ExportFormat;
	/** Filename without extension; the correct extension is appended. */
	filename: string;
	output: GeneratedOutput;
}

/**
 * Result of an export job. In the MVP the blob is produced in the browser; a
 * future backend implementation would return a blob fetched from an export
 * endpoint without changing this shape.
 */
export interface ExportResult {
	format: ExportFormat;
	/** Filename including extension. */
	filename: string;
	mimeType: string;
	blob: Blob;
}
