import { Document, Packer } from "docx";
import type { GeneratedOutput } from "@/features/ai/types";
import { markdownToBlocks } from "./markdown-to-docx";

export {
	markdownToBlocks,
	parseInlineSegments,
	splitTableCells,
} from "./markdown-to-docx";

/**
 * Build a real .docx file (as a Blob) from a generated Markdown output.
 *
 * This runs entirely in the browser for the MVP. A future backend could expose
 * a `/export/docx` endpoint returning the same Blob; the `WorkbenchApi.exportOutput`
 * seam means callers would not change.
 */
export async function buildDocxBlob(output: GeneratedOutput): Promise<Blob> {
	const children = markdownToBlocks(output.markdown);
	const doc = new Document({
		creator: "local-transcript-workbench",
		description: `Generated from template ${output.templateId}`,
		title: output.templateId,
		sections: [{ properties: {}, children }],
	});
	return Packer.toBlob(doc);
}
