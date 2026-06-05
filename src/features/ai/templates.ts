import type { OutputTemplateId } from "./types";

/**
 * Default template selected in the AI panel (a UI concern). The full template
 * catalogue is the mock backend's data and is fetched via `useTemplatesQuery`
 * (served by `WorkbenchApi.listTemplates`); it lives in `lib/mock-data`.
 */
export const DEFAULT_TEMPLATE_ID: OutputTemplateId = "meeting-summary";

/**
 * Human labels for the template ids — domain metadata the UI can use directly
 * without importing the mock backend's catalogue. Keeps components on the
 * `features` layer (components never import `lib/mock-data`).
 */
export const TEMPLATE_LABELS: Record<OutputTemplateId, string> = {
	"meeting-summary": "Meeting Summary",
	"action-items": "Action Items",
	"sales-call-notes": "Sales Call Notes",
	"interview-notes": "Interview Notes",
};

/** Label for a template id (falls back to Meeting Summary for unknown ids). */
export function templateName(value: string): string {
	return TEMPLATE_LABELS[value as OutputTemplateId] ?? "Meeting Summary";
}
