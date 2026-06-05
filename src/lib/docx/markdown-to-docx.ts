/**
 * A pragmatic Markdown → docx converter.
 *
 * It covers the subset the generators emit (ATX headings, bullet/ordered/task
 * lists, blockquotes, pipe tables, inline emphasis) and is best-effort for
 * arbitrary Markdown, so DOCX export keeps working when the real backend
 * returns Markdown only.
 *
 * Inline emphasis is parsed recursively: `**bold**`, `*italic*`, `__bold__`,
 * `_italic_`, `***bolditalic***`, and `` `code` ``. Underscore emphasis requires
 * non-word flanking (CommonMark-style) so identifiers / file paths / emails like
 * `user_profile`, `/var/my_app.log`, `a_b@x.com` are NOT mangled into italics.
 */
import {
	AlignmentType,
	HeadingLevel,
	Paragraph,
	Table,
	TableCell,
	TableRow,
	TextRun,
	WidthType,
} from "docx";

type Block = Paragraph | Table;

interface RunStyle {
	bold?: boolean;
	italics?: boolean;
	font?: string;
}

const DELIMITERS: ReadonlyArray<{
	marker: string;
	style: RunStyle;
	/** Asterisk markers have no flanking rule; underscore markers do. */
	asterisk: boolean;
}> = [
	{ marker: "***", style: { bold: true, italics: true }, asterisk: true },
	{ marker: "___", style: { bold: true, italics: true }, asterisk: false },
	{ marker: "**", style: { bold: true }, asterisk: true },
	{ marker: "__", style: { bold: true }, asterisk: false },
	{ marker: "*", style: { italics: true }, asterisk: true },
	{ marker: "_", style: { italics: true }, asterisk: false },
];

/** A run of text with resolved emphasis flags. Exported for testing. */
export interface InlineSegment {
	text: string;
	bold: boolean;
	italics: boolean;
	code: boolean;
}

function isWordChar(ch: string | undefined): boolean {
	return ch !== undefined && /\w/.test(ch);
}

/** Find the closing index of `marker` starting at `from`, honouring flanking. */
function findCloser(
	text: string,
	from: number,
	marker: string,
	asterisk: boolean,
): number {
	for (let j = from; j <= text.length - marker.length; j++) {
		if (!text.startsWith(marker, j)) continue;
		// Underscore closers must not be immediately followed by a word char.
		if (asterisk || !isWordChar(text[j + marker.length])) return j;
	}
	return -1;
}

/**
 * Parse inline emphasis into flagged text segments. Pure and recursive — the
 * single source of truth for emphasis handling. Concatenating the `text` of
 * every returned segment always reconstructs the input exactly (minus consumed
 * markers), so no characters are silently dropped.
 */
export function parseInlineSegments(
	text: string,
	base: { bold?: boolean; italics?: boolean } = {},
): InlineSegment[] {
	const segments: InlineSegment[] = [];
	let buffer = "";
	let i = 0;

	const flush = () => {
		if (buffer.length > 0) {
			segments.push({
				text: buffer,
				bold: Boolean(base.bold),
				italics: Boolean(base.italics),
				code: false,
			});
			buffer = "";
		}
	};

	while (i < text.length) {
		// Inline code: literal, no recursion.
		if (text[i] === "`") {
			const end = text.indexOf("`", i + 1);
			if (end > i) {
				flush();
				segments.push({
					text: text.slice(i + 1, end),
					bold: Boolean(base.bold),
					italics: Boolean(base.italics),
					code: true,
				});
				i = end + 1;
				continue;
			}
		}

		let matched = false;
		for (const delim of DELIMITERS) {
			if (!text.startsWith(delim.marker, i)) continue;
			// Underscore openers must not be immediately preceded by a word char.
			if (!delim.asterisk && isWordChar(text[i - 1])) continue;
			const close = findCloser(
				text,
				i + delim.marker.length,
				delim.marker,
				delim.asterisk,
			);
			if (close === -1) continue;
			const inner = text.slice(i + delim.marker.length, close);
			if (inner.length === 0) continue;
			flush();
			segments.push(
				...parseInlineSegments(inner, {
					bold: base.bold || delim.style.bold,
					italics: base.italics || delim.style.italics,
				}),
			);
			i = close + delim.marker.length;
			matched = true;
			break;
		}
		if (matched) continue;

		buffer += text[i];
		i++;
	}

	flush();
	return segments.length > 0
		? segments
		: [
				{
					text: "",
					bold: Boolean(base.bold),
					italics: Boolean(base.italics),
					code: false,
				},
			];
}

/** Parse inline emphasis into styled docx runs, merging an optional base style. */
function inlineRuns(text: string, base: RunStyle = {}): TextRun[] {
	return parseInlineSegments(text, base).map(
		(seg) =>
			new TextRun({
				text: seg.text,
				bold: seg.bold || undefined,
				italics: seg.italics || undefined,
				font: seg.code ? "Consolas" : undefined,
			}),
	);
}

const HEADING_LEVELS = [
	HeadingLevel.HEADING_1,
	HeadingLevel.HEADING_2,
	HeadingLevel.HEADING_3,
	HeadingLevel.HEADING_4,
	HeadingLevel.HEADING_5,
	HeadingLevel.HEADING_6,
] as const;

/** Split a table row on unescaped pipes, then unescape `\|` and `\\`. Exported for testing. */
export function splitTableCells(line: string): string[] {
	const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
	return trimmed
		.split(/(?<!\\)\|/)
		.map((cell) => cell.replace(/\\\|/g, "|").replace(/\\\\/g, "\\").trim());
}

function isTableSeparator(line: string): boolean {
	return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
}

function buildTable(rows: string[][]): Table {
	// Use the widest row so no cell is ever dropped (ragged rows are padded).
	const colCount = Math.max(1, ...rows.map((r) => r.length));
	const makeRow = (cells: string[], header: boolean) =>
		new TableRow({
			children: Array.from({ length: colCount }, (_, i) => {
				const content = cells[i] ?? "";
				return new TableCell({
					width: {
						size: Math.floor(100 / colCount),
						type: WidthType.PERCENTAGE,
					},
					children: [
						new Paragraph({
							children: inlineRuns(content, header ? { bold: true } : {}),
						}),
					],
				});
			}),
		});
	const [header, ...body] = rows;
	return new Table({
		width: { size: 100, type: WidthType.PERCENTAGE },
		rows: [makeRow(header, true), ...body.map((r) => makeRow(r, false))],
	});
}

/** Convert a Markdown document into an ordered list of docx blocks. */
export function markdownToBlocks(markdown: string): Block[] {
	const lines = markdown.replace(/\r\n/g, "\n").split("\n");
	const blocks: Block[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();
		if (trimmed.length === 0) continue;

		// Pipe table: a header row followed by a separator row.
		if (
			trimmed.startsWith("|") &&
			i + 1 < lines.length &&
			isTableSeparator(lines[i + 1])
		) {
			const rows: string[][] = [splitTableCells(trimmed)];
			i += 2; // skip header + separator
			while (i < lines.length && lines[i].trim().startsWith("|")) {
				rows.push(splitTableCells(lines[i]));
				i++;
			}
			i--; // step back; for-loop will advance
			blocks.push(buildTable(rows));
			continue;
		}

		// Headings (h1–h6).
		const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
		if (heading) {
			const level = HEADING_LEVELS[heading[1].length - 1];
			blocks.push(
				new Paragraph({ heading: level, children: inlineRuns(heading[2]) }),
			);
			continue;
		}

		// Blockquote.
		if (trimmed.startsWith(">")) {
			const text = trimmed.replace(/^>\s?/, "");
			blocks.push(
				new Paragraph({
					children: inlineRuns(text, { italics: true }),
					indent: { left: 360 },
					alignment: AlignmentType.LEFT,
				}),
			);
			continue;
		}

		// Task / bullet list.
		const task = /^[-*]\s+\[( |x|X)\]\s+(.*)$/.exec(trimmed);
		if (task) {
			const mark = task[1].toLowerCase() === "x" ? "☑ " : "☐ ";
			blocks.push(
				new Paragraph({
					bullet: { level: 0 },
					children: [new TextRun(mark), ...inlineRuns(task[2])],
				}),
			);
			continue;
		}
		const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
		if (bullet) {
			blocks.push(
				new Paragraph({
					bullet: { level: 0 },
					children: inlineRuns(bullet[1]),
				}),
			);
			continue;
		}

		// Ordered list: render with an explicit number prefix (no document-level
		// numbering config required).
		const ordered = /^(\d+)\.\s+(.*)$/.exec(trimmed);
		if (ordered) {
			blocks.push(
				new Paragraph({
					indent: { left: 360 },
					children: [
						new TextRun({ text: `${ordered[1]}. `, bold: true }),
						...inlineRuns(ordered[2]),
					],
				}),
			);
			continue;
		}

		// Plain paragraph.
		blocks.push(new Paragraph({ children: inlineRuns(trimmed) }));
	}

	return blocks;
}
