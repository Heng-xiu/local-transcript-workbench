import { Paragraph, Table } from "docx";
import { describe, expect, it } from "vitest";
import type { GeneratedOutput } from "@/features/ai/types";
import {
	buildDocxBlob,
	markdownToBlocks,
	parseInlineSegments,
	splitTableCells,
} from "@/lib/docx";

const joinText = (md: string) =>
	parseInlineSegments(md)
		.map((s) => s.text)
		.join("");

const SAMPLE = [
	"# Title",
	"",
	"Some **bold** and _italic_ text.",
	"- item one",
	"- [ ] a task",
	"1. first",
	"> a quote",
	"",
	"| A | B |",
	"| --- | --- |",
	"| 1 | 2 |",
].join("\n");

describe("markdownToBlocks", () => {
	it("produces docx blocks including a table", () => {
		const blocks = markdownToBlocks(SAMPLE);
		expect(blocks.length).toBeGreaterThan(5);
		expect(blocks.some((b) => b instanceof Table)).toBe(true);
		expect(blocks.some((b) => b instanceof Paragraph)).toBe(true);
	});

	it("ignores blank lines", () => {
		const blocks = markdownToBlocks("\n\n# Only\n\n");
		expect(blocks).toHaveLength(1);
	});
});

describe("parseInlineSegments (emphasis)", () => {
	it("does NOT italicize intra-word underscores (identifiers/paths/emails)", () => {
		const input = "migrate the user_profile and order_id fields";
		const segs = parseInlineSegments(input);
		expect(segs.every((s) => !s.italics)).toBe(true);
		expect(joinText(input)).toBe(input); // no characters dropped
		expect(joinText("/var/log/my_app_name.log")).toBe(
			"/var/log/my_app_name.log",
		);
		expect(joinText("snake_case_variable")).toBe("snake_case_variable");
	});

	it("still applies underscore emphasis at word boundaries", () => {
		const segs = parseInlineSegments("an _emphasised_ word");
		const em = segs.find((s) => s.text === "emphasised");
		expect(em?.italics).toBe(true);
	});

	it("handles nested and triple emphasis", () => {
		const nested = parseInlineSegments("**bold _italic_ end**");
		expect(nested.find((s) => s.text === "italic")).toMatchObject({
			bold: true,
			italics: true,
		});
		expect(nested.find((s) => s.text === "bold ")?.bold).toBe(true);

		const triple = parseInlineSegments("***both***");
		expect(triple).toEqual([
			{ text: "both", bold: true, italics: true, code: false },
		]);
	});

	it("treats inline code literally", () => {
		const segs = parseInlineSegments("call `fn_name()` now");
		expect(segs.find((s) => s.code)?.text).toBe("fn_name()");
	});
});

describe("splitTableCells", () => {
	it("keeps escaped pipes inside a cell", () => {
		expect(splitTableCells("| a \\| b | c |")).toEqual(["a | b", "c"]);
	});

	it("does not drop cells", () => {
		expect(splitTableCells("| 1 | 2 | 3 |")).toEqual(["1", "2", "3"]);
	});
});

describe("markdownToBlocks (tables & headings)", () => {
	it("builds a table from a ragged body row without throwing", () => {
		const md = ["| A | B |", "| --- | --- |", "| 1 | 2 | 3 |"].join("\n");
		const blocks = markdownToBlocks(md);
		expect(blocks.some((b) => b instanceof Table)).toBe(true);
	});

	it("renders h1–h6 headings as single blocks (no literal hashes)", () => {
		for (const hashes of ["#", "##", "###", "####", "#####", "######"]) {
			const blocks = markdownToBlocks(`${hashes} Heading`);
			expect(blocks).toHaveLength(1);
			expect(blocks[0]).toBeInstanceOf(Paragraph);
		}
	});
});

describe("buildDocxBlob", () => {
	it("produces a non-empty .docx blob", async () => {
		const output: GeneratedOutput = {
			id: "out_1",
			projectId: "p",
			transcriptId: "t",
			templateId: "meeting-summary",
			provider: "local",
			model: "local/test",
			markdown: SAMPLE,
			createdAt: "2026-06-04T00:00:00.000Z",
		};
		const blob = await buildDocxBlob(output);
		expect(blob.size).toBeGreaterThan(0);
	});
});
