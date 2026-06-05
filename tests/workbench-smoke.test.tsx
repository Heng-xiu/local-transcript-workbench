import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { WorkbenchLayout } from "@/components/layout/WorkbenchLayout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createQueryClient } from "@/lib/query-client";
import { mockDataset } from "@/lib/mock-data";

function renderWithProviders(ui: ReactNode) {
	const queryClient = createQueryClient();
	return render(
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>{ui}</TooltipProvider>
		</QueryClientProvider>,
	);
}

describe("WorkbenchLayout (full mount)", () => {
	it("mounts all three panels and loads a project's transcript", async () => {
		const project = mockDataset.projects[0];

		renderWithProviders(
			<WorkbenchLayout
				selectedProjectId={project.id}
				transcriptId={project.transcriptId}
				activeProject={project}
				onSelectProject={() => {}}
			/>,
		);

		// Header + active project name.
		expect(screen.getByText("Transcript Workbench")).toBeInTheDocument();
		expect(screen.getAllByText(project.name).length).toBeGreaterThan(0);

		// Right panel renders its primary action.
		expect(
			screen.getByRole("button", { name: "Generate" }),
		).toBeInTheDocument();

		// Sidebar loads the project list (async) and the transcript meta renders.
		await waitFor(() =>
			expect(screen.getByText(/segments$/)).toBeInTheDocument(),
		);
	});
});
