import { useForm } from "@tanstack/react-form";
import { Cloud, Cpu, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ExportControls } from "@/components/export/ExportControls";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	useGenerateOutputMutation,
	useTemplatesQuery,
} from "@/features/ai/queries";
import { DEFAULT_TEMPLATE_ID } from "@/features/ai/templates";
import type { GeneratedOutput, OutputTemplateId } from "@/features/ai/types";
import { useProjectQuery } from "@/features/projects/queries";
import { env } from "@/lib/config/env";
import { cn } from "@/lib/utils";
import { MarkdownView } from "./MarkdownView";

interface AIOutputPanelProps {
	projectId: string | undefined;
	transcriptId: string | undefined;
}

function ProviderBadge() {
	const isLocal = env.aiProviderMode === "local";
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
					{isLocal ? <Cpu className="size-3" /> : <Cloud className="size-3" />}
					{isLocal ? "Local LLM" : "OpenRouter"}
				</span>
			</TooltipTrigger>
			<TooltipContent>
				Generation runs on the backend ({env.aiProviderMode}). API keys never
				touch the frontend.
			</TooltipContent>
		</Tooltip>
	);
}

export function AIOutputPanel({ projectId, transcriptId }: AIOutputPanelProps) {
	const projectQuery = useProjectQuery(projectId);
	const templatesQuery = useTemplatesQuery();
	const templates = templatesQuery.data ?? [];

	const [streamed, setStreamed] = useState("");
	const [output, setOutput] = useState<GeneratedOutput | null>(null);

	const generate = useGenerateOutputMutation({
		onToken: (_chunk, full) => setStreamed(full),
	});

	const form = useForm({
		defaultValues: { templateId: DEFAULT_TEMPLATE_ID as OutputTemplateId },
	});

	// Reset generated output whenever the source transcript changes.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on transcript switch only
	useEffect(() => {
		setOutput(null);
		setStreamed("");
		generate.reset();
	}, [transcriptId]);

	const ready = Boolean(projectId && transcriptId);
	const projectName = projectQuery.data?.name ?? "transcript";

	async function runGeneration() {
		if (!projectId || !transcriptId) return;
		const templateId = form.state.values.templateId;
		setOutput(null);
		setStreamed("");
		try {
			const data = await generate.mutateAsync({
				projectId,
				transcriptId,
				templateId,
			});
			setOutput(data);
			setStreamed(data.markdown);
		} catch {
			// error surfaced via generate.isError below
		}
	}

	function selectTemplate(id: OutputTemplateId) {
		form.setFieldValue("templateId", id);
		setOutput(null);
		setStreamed("");
		generate.reset();
	}

	return (
		<form.Subscribe selector={(s) => s.values.templateId}>
			{(templateId) => (
				<aside className="flex h-full min-h-0 flex-col border-l bg-background">
					<div className="flex items-center justify-between border-b px-4 py-3">
						<h2 className="text-sm font-semibold">AI Output</h2>
						<ProviderBadge />
					</div>

					{/* Template selector (TanStack Form field). */}
					<div className="grid grid-cols-2 gap-2 border-b p-3">
						{templates.map((template) => {
							const selected = template.id === templateId;
							return (
								<Tooltip key={template.id}>
									<TooltipTrigger asChild>
										<button
											type="button"
											onClick={() => selectTemplate(template.id)}
											aria-pressed={selected}
											className={cn(
												"rounded-md border px-2.5 py-2 text-left text-xs font-medium transition-colors",
												"hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
												selected
													? "border-primary bg-primary/5 text-foreground"
													: "border-border text-muted-foreground",
											)}
										>
											{template.name}
										</button>
									</TooltipTrigger>
									<TooltipContent>{template.description}</TooltipContent>
								</Tooltip>
							);
						})}
					</div>

					<div className="border-b p-3">
						<Button
							type="button"
							className="w-full"
							disabled={!ready || generate.isPending}
							onClick={runGeneration}
						>
							{generate.isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Sparkles className="size-4" />
							)}
							{generate.isPending ? "Generating…" : "Generate"}
						</Button>
						{!ready ? (
							<p className="mt-2 text-center text-xs text-muted-foreground">
								Select a project to enable generation.
							</p>
						) : null}
					</div>

					<ScrollArea className="min-h-0 flex-1">
						<div className="p-4">
							{generate.isPending ? (
								streamed.length > 0 ? (
									<MarkdownView markdown={streamed} />
								) : (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Loader2 className="size-4 animate-spin" />
										Queued on the {env.aiProviderMode} backend…
									</div>
								)
							) : generate.isError ? (
								<p className="text-sm text-destructive">
									Generation failed. Please try again.
								</p>
							) : output ? (
								<div className="flex flex-col gap-3">
									<MarkdownView markdown={output.markdown} />
									<p className="border-t pt-2 text-[11px] text-muted-foreground">
										{output.model}
										{output.usage
											? ` · ~${output.usage.completionTokens} chars`
											: ""}
									</p>
								</div>
							) : (
								<div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
									<Sparkles className="size-8 opacity-40" />
									<p>Pick a template and generate a draft.</p>
								</div>
							)}
						</div>
					</ScrollArea>

					<ExportControls
						key={`${transcriptId ?? "none"}:${templateId}`}
						output={output}
						defaultFilename={`${projectName} ${templateId}`}
					/>
				</aside>
			)}
		</form.Subscribe>
	);
}
