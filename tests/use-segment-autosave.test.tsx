import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { useSegmentAutosave } from "@/features/segments/use-segment-autosave";
import type { TranscriptSegment } from "@/features/segments/types";
import { FAILURE_MARKER } from "@/lib/api/latency";
import { createQueryClient } from "@/lib/query-client";
import { mockDataset } from "@/lib/mock-data";
import { segmentStatusActions } from "@/lib/stores/segment-status-store";

function firstSegment(): TranscriptSegment {
	const transcriptId = mockDataset.projects[0].transcriptId;
	const segments = mockDataset.segmentsByTranscript.get(transcriptId);
	if (!segments?.length) throw new Error("fixture missing segments");
	return segments[0];
}

function renderAutosave(segment: TranscriptSegment) {
	const queryClient = createQueryClient();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	return renderHook(
		() => useSegmentAutosave(segment, segment.transcriptId),
		{ wrapper },
	);
}

describe("useSegmentAutosave", () => {
	beforeEach(() => {
		segmentStatusActions.reset();
	});

	it("goes dirty then saved on flush", async () => {
		const segment = firstSegment();
		const { result } = renderAutosave(segment);

		act(() => {
			result.current.onChange("A freshly edited line.");
		});
		expect(result.current.status.state).toBe("dirty");
		expect(result.current.draft).toBe("A freshly edited line.");

		act(() => {
			result.current.flush();
		});
		await waitFor(() => expect(result.current.status.state).toBe("saved"));
	});

	it("surfaces an error then recovers", async () => {
		const segment = firstSegment();
		const { result } = renderAutosave(segment);

		act(() => {
			result.current.onChange(`broken ${FAILURE_MARKER}`);
			result.current.flush();
		});
		await waitFor(() => expect(result.current.status.state).toBe("error"));

		act(() => {
			result.current.onChange("now valid");
			result.current.flush();
		});
		await waitFor(() => expect(result.current.status.state).toBe("saved"));
	});
});
