import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SaveStatusBadge } from "@/components/transcript/SaveStatusBadge";

describe("SaveStatusBadge", () => {
	it("renders each save state", () => {
		const { rerender } = render(
			<SaveStatusBadge status={{ segmentId: "s", state: "saving" }} />,
		);
		expect(screen.getByText("Saving…")).toBeInTheDocument();

		rerender(<SaveStatusBadge status={{ segmentId: "s", state: "saved" }} />);
		expect(screen.getByText("Saved")).toBeInTheDocument();

		rerender(<SaveStatusBadge status={{ segmentId: "s", state: "dirty" }} />);
		expect(screen.getByText("Unsaved")).toBeInTheDocument();
	});

	it("offers a retry action on error", async () => {
		const onRetry = vi.fn();
		render(
			<SaveStatusBadge
				status={{ segmentId: "s", state: "error", error: "nope" }}
				onRetry={onRetry}
			/>,
		);
		expect(screen.getByText("Save failed")).toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(onRetry).toHaveBeenCalledOnce();
	});
});
