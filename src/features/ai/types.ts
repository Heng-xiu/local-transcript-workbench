import type { AIProviderMode } from "@/lib/config/env";

/** The four supported output templates. */
export type OutputTemplateId =
	| "meeting-summary"
	| "action-items"
	| "sales-call-notes"
	| "interview-notes";

export interface OutputTemplate {
	id: OutputTemplateId;
	name: string;
	description: string;
	/**
	 * A hint describing the prompt the backend should run for this template.
	 * The frontend never builds real prompts; this documents intent and is sent
	 * to the backend as metadata.
	 */
	systemPromptHint: string;
}

/** Lifecycle of a generation job, surfaced through TanStack Query state. */
export type GenerationState =
	| "idle"
	| "queued"
	| "streaming"
	| "done"
	| "error";

/** The Markdown document produced by a generation job. */
export interface GeneratedOutput {
	id: string;
	projectId: string;
	transcriptId: string;
	templateId: OutputTemplateId;
	/** Which provider the backend used (display only). */
	provider: AIProviderMode;
	/** Opaque model identifier, e.g. "local/llama-3.1-8b-instruct". */
	model: string;
	markdown: string;
	createdAt: string;
	/** Token usage placeholder for future backend reporting. */
	usage?: {
		promptTokens: number;
		completionTokens: number;
	};
}
