import type { ReactNode } from "react";
import { MeetingDetail } from "@/components/meetings/MeetingDetail";
import { MeetingSidebar } from "@/components/meetings/MeetingSidebar";
import { MeetingRecordDetail } from "@/components/records/MeetingRecordDetail";
import { RecordSidebar } from "@/components/records/RecordSidebar";
import { SettingsOverview } from "@/components/settings/SettingsOverview";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { TranscriptsSection } from "@/components/transcripts/TranscriptsSection";
import type { NavigationSection } from "@/features/navigation/types";
import { AppHeader } from "./AppHeader";
import { GlobalNavigationRail } from "./GlobalNavigationRail";

interface WorkbenchLayoutProps {
	section: NavigationSection;
	meetingId: string | undefined;
	transcriptId: string | undefined;
	recordId: string | undefined;
	onSelectSection: (section: NavigationSection) => void;
	onSelectMeeting: (meetingId: string) => void;
	onOpenTranscript: (transcriptId: string) => void;
	onOpenRecord: (recordId: string) => void;
}

/** Two-column section shell: context sidebar (18rem) + main content. */
function SectionGrid({
	sidebar,
	main,
}: {
	sidebar: ReactNode;
	main: ReactNode;
}) {
	return (
		<div className="grid h-full min-h-0 grid-cols-[18rem_minmax(0,1fr)]">
			{sidebar}
			<section className="min-w-0 overflow-hidden">{main}</section>
		</div>
	);
}

/**
 * The app shell: `GlobalNavigationRail | ContextSidebar | MainContent | optional
 * RightPanel`. The rail selects the workflow section (Meetings → Transcripts →
 * Records → Settings); each section owns its own context sidebar + main content,
 * and the Transcripts editor adds the AI/export RightPanel. All selection lives
 * in the URL and is threaded in via props (so the shell is deep-linkable and
 * testable without a router).
 */
export function WorkbenchLayout({
	section,
	meetingId,
	transcriptId,
	recordId,
	onSelectSection,
	onSelectMeeting,
	onOpenTranscript,
	onOpenRecord,
}: WorkbenchLayoutProps) {
	let content: ReactNode;
	switch (section) {
		case "meetings":
			content = (
				<SectionGrid
					sidebar={
						<MeetingSidebar
							selectedMeetingId={meetingId}
							onSelect={onSelectMeeting}
						/>
					}
					main={
						<MeetingDetail
							meetingId={meetingId}
							onOpenTranscript={onOpenTranscript}
							onOpenRecord={onOpenRecord}
						/>
					}
				/>
			);
			break;
		case "transcripts":
			content = (
				<TranscriptsSection
					transcriptId={transcriptId}
					onSelectTranscript={onOpenTranscript}
				/>
			);
			break;
		case "records":
			content = (
				<SectionGrid
					sidebar={
						<RecordSidebar
							selectedRecordId={recordId}
							onSelect={onOpenRecord}
						/>
					}
					main={<MeetingRecordDetail recordId={recordId} />}
				/>
			);
			break;
		case "settings":
			content = (
				<SectionGrid
					sidebar={<SettingsSidebar />}
					main={<SettingsOverview />}
				/>
			);
			break;
	}

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
			<AppHeader section={section} />
			<div className="flex min-h-0 flex-1">
				<GlobalNavigationRail section={section} onSelect={onSelectSection} />
				<div className="min-w-0 flex-1">{content}</div>
			</div>
		</div>
	);
}
