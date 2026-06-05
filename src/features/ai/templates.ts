import type { OutputTemplateId } from "./types";

/**
 * Default template selected in the AI panel (a UI concern). The full template
 * catalogue is the mock backend's data and is fetched via `useTemplatesQuery`
 * (served by `WorkbenchApi.listTemplates`); it lives in `lib/mock-data`.
 */
export const DEFAULT_TEMPLATE_ID: OutputTemplateId = "meeting-summary";
