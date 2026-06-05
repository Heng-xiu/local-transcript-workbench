import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkbenchLayout } from "@/components/layout/WorkbenchLayout";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { NavigationSection } from "@/features/navigation/types";
import { createQueryClient } from "@/lib/query-client";

const SECTION_LABELS = ["Meetings", "Transcripts", "Records", "Settings"];

function renderShell(props: {
	section?: NavigationSection;
	meetingId?: string;
	transcriptId?: string;
	recordId?: string;
}) {
	const queryClient = createQueryClient();
	const handlers = {
		onSelectSection: vi.fn(),
		onSelectMeeting: vi.fn(),
		onOpenTranscript: vi.fn(),
		onOpenRecord: vi.fn(),
	};
	const utils = render(
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<WorkbenchLayout
					section={props.section ?? "meetings"}
					meetingId={props.meetingId}
					transcriptId={props.transcriptId}
					recordId={props.recordId}
					onSelectSection={handlers.onSelectSection}
					onSelectMeeting={handlers.onSelectMeeting}
					onOpenTranscript={handlers.onOpenTranscript}
					onOpenRecord={handlers.onOpenRecord}
				/>
			</TooltipProvider>
		</QueryClientProvider>,
	);
	return { ...utils, handlers };
}

describe("GlobalNavigationRail", () => {
	it("renders all four sections and marks the active one", async () => {
		const { handlers } = renderShell({ section: "meetings" });
		for (const label of SECTION_LABELS) {
			expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
		}
		expect(
			screen.getByRole("button", { name: "Meetings" }),
		).toHaveAttribute("aria-current", "page");

		fireEvent.click(screen.getByRole("button", { name: "Records" }));
		expect(handlers.onSelectSection).toHaveBeenCalledWith("records");
		// flush async sidebar queries
		await screen.findByText("Customer Advisory Board — Kickoff");
	});
});

describe("Meetings section", () => {
	it("shows the meeting list and opens MeetingDetail (not the editor)", async () => {
		const { handlers } = renderShell({ section: "meetings" });
		const meetingItem = await screen.findByText("Q3 Product Strategy Sync");
		fireEvent.click(meetingItem);
		expect(handlers.onSelectMeeting).toHaveBeenCalledWith("mtg_q3-strategy");
		// The meeting list never opens the transcript editor.
		expect(screen.queryByRole("button", { name: "Generate" })).toBeNull();
	});

	it("renders session details and an Open transcript action", async () => {
		renderShell({ section: "meetings", meetingId: "mtg_q3-strategy" });
		expect(await screen.findByText("Local LiveKit room")).toBeInTheDocument();
		expect(
			await screen.findByRole("button", { name: /Open transcript/ }),
		).toBeInTheDocument();
		// Still a meeting detail screen, not the editor.
		expect(screen.queryByRole("button", { name: "Generate" })).toBeNull();
	});
});

describe("Transcripts section status gate", () => {
	it("shows the processing view for a processing transcript", async () => {
		renderShell({ section: "transcripts", transcriptId: "tr_eng-standup" });
		expect(
			await screen.findByText(/Transcript is being generated/),
		).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Generate" })).toBeNull();
	});

	it("opens the existing editor for a ready_for_edit transcript", async () => {
		renderShell({ section: "transcripts", transcriptId: "tr_q3-strategy" });
		expect(
			await screen.findByText(/\d+ segments/, {}, { timeout: 4000 }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Generate" }),
		).toBeInTheDocument();
	});

	it("shows the failed view for a failed transcript", async () => {
		renderShell({ section: "transcripts", transcriptId: "tr_podcast-ep12" });
		expect(
			await screen.findByText(/Transcription failed/),
		).toBeInTheDocument();
	});
});

describe("Records section", () => {
	it("renders the RecordSidebar list plus MeetingRecordDetail with export actions", async () => {
		renderShell({ section: "records", recordId: "rec_q3-strategy" });
		// RecordSidebar list rendered: another record (not the open one) is listed.
		expect(
			await screen.findByText("Acme Corp — Discovery Call — Sales Call Notes"),
		).toBeInTheDocument();
		// MeetingRecordDetail rendered the ready record's markdown + export actions.
		expect(
			await screen.findByText(/Meeting Summary —/, {}, { timeout: 4000 }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Export DOCX/ }),
		).toBeInTheDocument();
	});

	it("shows a loading state then markdown when generating a record", async () => {
		renderShell({ section: "records", recordId: "rec_onboarding-interview" });
		const generateBtn = await screen.findByRole("button", {
			name: /Generate record/,
		});
		fireEvent.click(generateBtn);
		expect(
			await screen.findByText(/Generating meeting record/),
		).toBeInTheDocument();
		expect(
			await screen.findByText(/Interview Notes —/, {}, { timeout: 5000 }),
		).toBeInTheDocument();
	});

	it("shows retry UI when generation fails", async () => {
		renderShell({ section: "records", recordId: "rec_sprint-retro" });
		const retryBtn = await screen.findByRole("button", {
			name: /Retry generation/,
		});
		fireEvent.click(retryBtn);
		expect(
			await screen.findByText(/Generating meeting record/),
		).toBeInTheDocument();
		await waitFor(
			() =>
				expect(
					screen.getByRole("button", { name: /Retry generation/ }),
				).toBeInTheDocument(),
			{ timeout: 5000 },
		);
	});

	it("surfaces export state when exporting Markdown", async () => {
		renderShell({ section: "records", recordId: "rec_q3-strategy" });
		const exportBtn = await screen.findByRole("button", {
			name: /Export Markdown/,
		});
		fireEvent.click(exportBtn);
		expect(await screen.findByText(/Exporting/)).toBeInTheDocument();
		await waitFor(
			() => expect(screen.getByText(/Downloaded/)).toBeInTheDocument(),
			{ timeout: 4000 },
		);
	});
});

describe("Settings section", () => {
	it("shows local integration and storage placeholders", async () => {
		renderShell({ section: "settings" });
		expect(
			(await screen.findAllByText("Local backend API")).length,
		).toBeGreaterThan(0);
		expect(screen.getAllByText("Local LiveKit server URL").length).toBeGreaterThan(
			0,
		);
		expect(screen.getAllByText("Local LLM provider").length).toBeGreaterThan(0);
		expect(
			screen.getAllByText("OpenRouter mode (backend only)").length,
		).toBeGreaterThan(0);
		expect(screen.getAllByText("Recording storage").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Markdown export").length).toBeGreaterThan(0);
		expect(screen.getAllByText("DOCX export").length).toBeGreaterThan(0);
		expect(screen.getByText(/Storage usage/)).toBeInTheDocument();
	});
});
