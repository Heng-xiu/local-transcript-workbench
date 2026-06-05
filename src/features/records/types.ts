/**
 * A meeting record is the formal, AI-assisted meeting minutes generated from a
 * corrected transcript. It is the deliverable of the MVP workflow. **Export is
 * an action performed on a record** (Markdown / DOCX), not a separate concept.
 */
export type MeetingRecordStatus =
	| "not_started"
	| "generating"
	| "ready"
	| "failed"
	| "exported";

export const MEETING_RECORD_STATUS_LABELS: Record<MeetingRecordStatus, string> =
	{
		not_started: "Not started",
		generating: "Generating",
		ready: "Ready",
		failed: "Failed",
		exported: "Exported",
	};

export interface MeetingRecord {
	id: string;
	meetingId?: string;
	transcriptId: string;
	title: string;
	/** The output template the record was generated from (an `OutputTemplateId`). */
	templateId: string;
	status: MeetingRecordStatus;
	/** Generated Markdown; absent until the record is `ready`/`exported`. */
	markdown?: string;
	exportedMarkdownAt?: string;
	exportedDocxAt?: string;
	updatedAt: string;
}
