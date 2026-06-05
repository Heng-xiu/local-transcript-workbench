/**
 * App-level navigation. The MVP workflow is **Meetings → Transcripts → Records
 * → Export**, surfaced as four top-level sections in the global navigation rail.
 * Export is an *action* performed on a record, not a section. Projects are not a
 * primary rail item in this version (they remain optional grouping metadata).
 */
export type NavigationSection =
	| "meetings"
	| "transcripts"
	| "records"
	| "settings";

export interface NavigationSectionMeta {
	id: NavigationSection;
	label: string;
	/** Short blurb shown as the header subtitle / rail tooltip. */
	description: string;
}

/** Ordered section catalogue rendered by the global navigation rail. */
export const NAVIGATION_SECTIONS: readonly NavigationSectionMeta[] = [
	{
		id: "meetings",
		label: "Meetings",
		description: "Local LiveKit meeting sessions",
	},
	{
		id: "transcripts",
		label: "Transcripts",
		description: "Editable transcript artifacts",
	},
	{
		id: "records",
		label: "Records",
		description: "Formal AI-assisted meeting records",
	},
	{
		id: "settings",
		label: "Settings",
		description: "Local integration status",
	},
] as const;

const VALID_SECTIONS = new Set<NavigationSection>(
	NAVIGATION_SECTIONS.map((s) => s.id),
);

export function isNavigationSection(
	value: unknown,
): value is NavigationSection {
	return (
		typeof value === "string" && VALID_SECTIONS.has(value as NavigationSection)
	);
}

/**
 * Resolve which section to display from the URL search state. Defaults to
 * `meetings`. If no explicit section is set but a transcript is deep-linked,
 * open `transcripts` so existing transcript links keep working. Kept as a pure,
 * tested function so the default behaviour is explicit.
 */
export function resolveSection(search: {
	section?: NavigationSection;
	transcriptId?: string;
}): NavigationSection {
	if (search.section && isNavigationSection(search.section)) {
		return search.section;
	}
	if (search.transcriptId) return "transcripts";
	return "meetings";
}
