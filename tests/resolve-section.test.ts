import { describe, expect, it } from "vitest";
import {
	isNavigationSection,
	resolveSection,
} from "@/features/navigation/types";

describe("resolveSection", () => {
	it("defaults to meetings when nothing is selected", () => {
		expect(resolveSection({})).toBe("meetings");
	});

	it("opens transcripts when a transcript is deep-linked but no section set", () => {
		expect(resolveSection({ transcriptId: "tr_x" })).toBe("transcripts");
	});

	it("respects an explicit section over a deep-linked transcript", () => {
		expect(resolveSection({ section: "records", transcriptId: "tr_x" })).toBe(
			"records",
		);
	});

	it.each(["meetings", "transcripts", "records", "settings"] as const)(
		"returns the explicit %s section",
		(section) => {
			expect(resolveSection({ section })).toBe(section);
		},
	);
});

describe("isNavigationSection", () => {
	it("accepts the four known sections", () => {
		for (const s of ["meetings", "transcripts", "records", "settings"]) {
			expect(isNavigationSection(s)).toBe(true);
		}
	});

	it("rejects unknown values", () => {
		expect(isNavigationSection("projects")).toBe(false);
		expect(isNavigationSection(undefined)).toBe(false);
		expect(isNavigationSection(42)).toBe(false);
	});
});
