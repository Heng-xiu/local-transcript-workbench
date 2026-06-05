import type { OutputTemplate, OutputTemplateId } from "@/features/ai/types";

/**
 * The mock backend's template catalogue. Served through `WorkbenchApi.listTemplates`.
 * Lives in `lib/mock-data` (the mock backend) so the `lib` layer never imports
 * runtime values from `features` — dependencies flow `features -> lib` only.
 * The four template ids themselves are part of the domain (`features/ai/types`).
 */
export const OUTPUT_TEMPLATES: readonly OutputTemplate[] = [
	{
		id: "meeting-summary",
		name: "Meeting Summary",
		description: "Concise overview, key discussion points, and decisions made.",
		systemPromptHint:
			"Summarise the meeting transcript into an executive overview, key discussion points grouped by theme, and explicit decisions.",
	},
	{
		id: "action-items",
		name: "Action Items",
		description: "Owners, tasks, and due dates extracted as a checklist.",
		systemPromptHint:
			"Extract every commitment from the transcript as action items with owner, task, and due date where stated.",
	},
	{
		id: "sales-call-notes",
		name: "Sales Call Notes",
		description: "BANT/MEDDIC-style notes, objections, and next steps.",
		systemPromptHint:
			"Produce structured sales notes: prospect context, pain points, budget/authority/need/timeline signals, objections, and next steps.",
	},
	{
		id: "interview-notes",
		name: "Interview Notes",
		description: "Themes, notable quotes, and research insights.",
		systemPromptHint:
			"Synthesise the interview into themes, supporting verbatim quotes, surprising insights, and recommended follow-ups.",
	},
] as const;

const TEMPLATE_IDS = new Set<OutputTemplateId>(
	OUTPUT_TEMPLATES.map((t) => t.id),
);

/** Narrow an arbitrary template id string to a known `OutputTemplateId`. */
export function coerceTemplateId(value: string): OutputTemplateId {
	return TEMPLATE_IDS.has(value as OutputTemplateId)
		? (value as OutputTemplateId)
		: "meeting-summary";
}

/** Human label for a template id (falls back to Meeting Summary). */
export function templateName(value: string): string {
	const id = coerceTemplateId(value);
	return OUTPUT_TEMPLATES.find((t) => t.id === id)?.name ?? "Meeting Summary";
}
