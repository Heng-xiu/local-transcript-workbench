import { ContextSidebar } from "@/components/layout/ContextSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntegrationStatusesQuery } from "@/features/settings/queries";
import { SettingsStatusPill } from "./SettingsStatusPill";

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6"] as const;

/**
 * Read-only index of local/self-hosted integrations. Mirrors the cards in the
 * overview; selecting is not required because Settings is a status surface, not
 * an editor.
 */
export function SettingsSidebar() {
	const integrationsQuery = useIntegrationStatusesQuery();
	const integrations = integrationsQuery.data ?? [];

	return (
		<ContextSidebar title="Settings" description="Local integration status">
			{integrationsQuery.isPending ? (
				SKELETON_KEYS.map((key) => (
					<Skeleton key={key} className="h-10 w-full rounded-md" />
				))
			) : integrationsQuery.isError ? (
				<p className="px-3 py-6 text-sm text-destructive">
					Failed to load settings.
				</p>
			) : (
				integrations.map((integration) => (
					<div
						key={integration.id}
						className="flex items-center justify-between gap-2 rounded-md px-3 py-2"
					>
						<span className="min-w-0 truncate text-sm">{integration.name}</span>
						<SettingsStatusPill status={integration.status} />
					</div>
				))
			)}
		</ContextSidebar>
	);
}
