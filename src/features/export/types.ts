import type { GeneratedOutput } from "@/features/ai/types";

export type ExportFormat = "markdown" | "docx";

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
