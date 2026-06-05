import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { WorkbenchLayout } from "@/components/layout/WorkbenchLayout";
import {
	type NavigationSection,
	resolveSection,
} from "@/features/navigation/types";

/**
 * All selection lives in the URL (TanStack Router search params) so the app is
 * deep-linkable and back/forward navigable. `section` selects the workflow
 * section; the per-section ids track the active row. `projectId` is retained for
 * backward-compatible deep links (the transcript editor derives it now).
 */
const searchSchema = z.object({
	section: z
		.enum(["meetings", "transcripts", "records", "settings"])
		.optional()
		.catch(undefined),
	meetingId: z.string().optional().catch(undefined),
	transcriptId: z.string().optional().catch(undefined),
	recordId: z.string().optional().catch(undefined),
	projectId: z.string().optional().catch(undefined),
});

type WorkbenchSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/")({
	validateSearch: (search) => searchSchema.parse(search),
	component: WorkbenchRoute,
});

function WorkbenchRoute() {
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const section = resolveSection(search);

	function go(next: Partial<WorkbenchSearch>) {
		void navigate({ search: (prev) => ({ ...prev, ...next }) });
	}

	return (
		<WorkbenchLayout
			section={section}
			meetingId={search.meetingId}
			transcriptId={search.transcriptId}
			recordId={search.recordId}
			onSelectSection={(next: NavigationSection) => go({ section: next })}
			onSelectMeeting={(meetingId) => go({ section: "meetings", meetingId })}
			onOpenTranscript={(transcriptId) =>
				go({ section: "transcripts", transcriptId })
			}
			onOpenRecord={(recordId) => go({ section: "records", recordId })}
		/>
	);
}
