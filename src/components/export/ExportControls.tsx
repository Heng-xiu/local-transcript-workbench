import { useForm } from "@tanstack/react-form";
import { Check, Copy, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { GeneratedOutput } from "@/features/ai/types";
import { useExportMutation } from "@/features/export/queries";
import type { ExportFormat } from "@/features/export/types";
import { copyToClipboard } from "@/lib/utils/clipboard";

interface ExportControlsProps {
	output: GeneratedOutput | null;
	defaultFilename: string;
}

function sanitizeFilename(name: string): string {
	// Remove only characters illegal in filenames; preserve letters in all
	// scripts (CJK, accented, etc.) so e.g. "会议纪要 2026" stays intact.
	const cleaned = name
		.trim()
		.replace(/[\\/:*?"<>|]+/g, "")
		.replace(/\s+/g, "-");
	return cleaned.length > 0 ? cleaned : "export";
}

/**
 * Export options are managed by TanStack Form (filename + format); the export
 * job itself runs through a TanStack Query mutation. DOCX is produced for real
 * in the browser. Copy puts the raw Markdown on the clipboard.
 */
export function ExportControls({
	output,
	defaultFilename,
}: ExportControlsProps) {
	const exportMutation = useExportMutation();
	const [copied, setCopied] = useState(false);

	const form = useForm({
		defaultValues: {
			filename: defaultFilename,
			format: "docx" as ExportFormat,
		},
		onSubmit: async ({ value }) => {
			if (!output) return;
			await exportMutation.mutateAsync({
				format: value.format,
				filename: sanitizeFilename(value.filename),
				output,
			});
		},
	});

	const disabled = !output;

	async function handleCopy() {
		if (!output) return;
		const ok = await copyToClipboard(output.markdown);
		if (ok) {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				void form.handleSubmit();
			}}
			className="flex flex-col gap-3 border-t bg-card p-4"
		>
			<div className="grid grid-cols-[1fr_auto] gap-2">
				<form.Field name="filename">
					{(field) => (
						<div className="flex flex-col gap-1">
							<Label htmlFor="export-filename" className="text-xs">
								File name
							</Label>
							<Input
								id="export-filename"
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								onBlur={field.handleBlur}
								disabled={disabled}
								className="h-8"
							/>
						</div>
					)}
				</form.Field>
				<form.Field name="format">
					{(field) => (
						<div className="flex flex-col gap-1">
							<Label className="text-xs">Format</Label>
							<Select
								value={field.state.value}
								onValueChange={(v) => field.handleChange(v as ExportFormat)}
								disabled={disabled}
							>
								<SelectTrigger size="sm" className="w-[136px]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="docx">Word (.docx)</SelectItem>
									<SelectItem value="markdown">Markdown (.md)</SelectItem>
								</SelectContent>
							</Select>
						</div>
					)}
				</form.Field>
			</div>

			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleCopy}
					disabled={disabled}
					className="flex-1"
				>
					{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
					{copied ? "Copied" : "Copy Markdown"}
				</Button>
				<form.Subscribe selector={(s) => s.values.format}>
					{(format) => (
						<Button
							type="submit"
							size="sm"
							disabled={disabled || exportMutation.isPending}
							className="flex-1"
						>
							{exportMutation.isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Download className="size-4" />
							)}
							Export {format === "docx" ? ".docx" : ".md"}
						</Button>
					)}
				</form.Subscribe>
			</div>

			{exportMutation.isError ? (
				<p className="text-xs text-destructive">
					Export failed. Please try again.
				</p>
			) : exportMutation.isSuccess ? (
				<p className="text-xs text-emerald-600 dark:text-emerald-400">
					Downloaded {exportMutation.data.filename}
				</p>
			) : null}
		</form>
	);
}
