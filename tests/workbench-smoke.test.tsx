import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { WorkbenchLayout } from "@/components/layout/WorkbenchLayout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createQueryClient } from "@/lib/query-client";

function renderWithProviders(ui: ReactNode) {
	const queryClient = createQueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>{ui}</TooltipProvider>
		</QueryClientProvider>,
	);
}

describe("WorkbenchLayout (full mount)", () => {
	it("mounts the app shell and the transcript editor for a ready transcript", async () => {
		renderWithProviders(
			<WorkbenchLayout
				section="transcripts"
				meetingId={undefined}
				transcriptId="tr_q3-strategy"
				recordId={undefined}
				onSelectSection={() => {}}
				onSelectMeeting={() => {}}
				onOpenTranscript={() => {}}
				onOpenRecord={() => {}}
			/>,
		);

		// App header brand + global navigation rail.
		expect(screen.getByText("Meeting Workbench")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Transcripts" }),
		).toBeInTheDocument();

		// The virtualised editor loads the transcript's segments (async); the
		// editor + right AI panel mount once the transcript is known to be ready.
		await waitFor(
			() => expect(screen.getByText(/\d+ segments/)).toBeInTheDocument(),
			{ timeout: 4000 },
		);

		// The right AI panel renders its primary action.
		expect(
			screen.getByRole("button", { name: "Generate" }),
		).toBeInTheDocument();
	});
});
