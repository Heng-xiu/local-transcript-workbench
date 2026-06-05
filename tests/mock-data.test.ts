import { describe, expect, it } from "vitest";
import { mockDataset } from "@/lib/mock-data";

describe("mockDataset", () => {
	it("exposes projects across every status", () => {
		const statuses = new Set(mockDataset.projects.map((p) => p.status));
		expect(statuses).toContain("ready");
		expect(statuses).toContain("processing");
		expect(statuses).toContain("recording");
		expect(statuses).toContain("archived");
		expect(statuses).toContain("error");
	});

	it("includes a large transcript for virtualization", () => {
		const big = mockDataset.projects.find((p) => p.segmentCount >= 1000);
		expect(big).toBeDefined();
	});

	it("keeps project metadata consistent with its segments", () => {
		for (const project of mockDataset.projects) {
			const segments = mockDataset.segmentsByTranscript.get(project.transcriptId);
			expect(segments).toBeDefined();
			expect(segments?.length).toBe(project.segmentCount);
		}
	});

	it("orders segments by start time and indexes them sequentially", () => {
		for (const segments of mockDataset.segmentsByTranscript.values()) {
			for (let i = 1; i < segments.length; i++) {
				expect(segments[i].startSec).toBeGreaterThanOrEqual(
					segments[i - 1].startSec,
				);
				expect(segments[i].index).toBe(i);
			}
		}
	});
});
