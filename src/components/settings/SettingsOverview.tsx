import { HardDrive } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useIntegrationStatusesQuery,
	useStorageStatusQuery,
} from "@/features/settings/queries";
import type { LocalIntegrationStatus } from "@/features/settings/types";
import { formatBytes } from "@/lib/utils/time";
import { SettingsStatusPill } from "./SettingsStatusPill";

function IntegrationCard({
	integration,
}: {
	integration: LocalIntegrationStatus;
}) {
	const details = integration.details
		? Object.entries(integration.details)
		: [];
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between gap-2 text-sm">
					<span className="min-w-0 truncate">{integration.name}</span>
					<SettingsStatusPill status={integration.status} />
				</CardTitle>
				<CardDescription>{integration.description}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				{details.length > 0 ? (
					<dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
						{details.map(([key, value]) => (
							<div key={key} className="contents">
								<dt className="text-muted-foreground">{key}</dt>
								<dd className="min-w-0 truncate font-mono text-foreground/80">
									{String(value)}
								</dd>
							</div>
						))}
					</dl>
				) : null}
				{integration.envVars.length > 0 ? (
					<div className="flex flex-wrap gap-1">
						{integration.envVars.map((envVar) => (
							<code
								key={envVar}
								className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
							>
								{envVar}
							</code>
						))}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

function StorageCard() {
	const storageQuery = useStorageStatusQuery();

	if (storageQuery.isPending) {
		return <Skeleton className="h-40 w-full" />;
	}
	if (storageQuery.isError || !storageQuery.data) {
		return null;
	}

	const storage = storageQuery.data;
	const usedPct =
		storage.totalBytes > 0
			? Math.min(
					100,
					Math.round((storage.usedBytes / storage.totalBytes) * 100),
				)
			: 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-sm">
					<HardDrive className="size-4" /> Storage usage
				</CardTitle>
				<CardDescription>
					Mock values — real capacity must come from a backend endpoint (GET
					/system/storage).
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<Progress value={usedPct} />
				<p className="text-xs text-muted-foreground tabular-nums">
					{formatBytes(storage.usedBytes)} of {formatBytes(storage.totalBytes)}{" "}
					used ({usedPct}%)
				</p>
				<dl className="grid grid-cols-3 gap-3 text-xs">
					<div className="flex flex-col">
						<dt className="text-muted-foreground">Recordings</dt>
						<dd className="tabular-nums">
							{formatBytes(storage.recordingBytes)}
						</dd>
					</div>
					<div className="flex flex-col">
						<dt className="text-muted-foreground">Transcripts</dt>
						<dd className="tabular-nums">
							{formatBytes(storage.transcriptBytes)}
						</dd>
					</div>
					<div className="flex flex-col">
						<dt className="text-muted-foreground">Exports</dt>
						<dd className="tabular-nums">{formatBytes(storage.exportBytes)}</dd>
					</div>
				</dl>
			</CardContent>
		</Card>
	);
}

/**
 * Read-only local/self-hosted integration status overview. Not an admin
 * console: no secret values, no credential editing in the MVP.
 */
export function SettingsOverview() {
	const integrationsQuery = useIntegrationStatusesQuery();

	return (
		<div className="h-full min-h-0 overflow-y-auto">
			<div className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
				<header className="flex flex-col gap-1">
					<h1 className="text-xl font-semibold">Local integrations</h1>
					<p className="text-sm text-muted-foreground">
						Status of the self-hosted backend services this workbench expects.
						Configuration lives in <code className="text-xs">VITE_*</code> env
						vars; secrets never live in the frontend.
					</p>
				</header>

				<StorageCard />

				{integrationsQuery.isPending ? (
					<div className="grid gap-4 sm:grid-cols-2">
						<Skeleton className="h-40 w-full" />
						<Skeleton className="h-40 w-full" />
					</div>
				) : integrationsQuery.isError ? (
					<p className="text-sm text-destructive">
						Failed to load integration status.
					</p>
				) : (
					<div className="grid gap-4 sm:grid-cols-2">
						{(integrationsQuery.data ?? []).map((integration) => (
							<IntegrationCard key={integration.id} integration={integration} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
