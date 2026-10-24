"use client";

import type { Artifact } from "stardew-valley-data";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { collectionsText } from "@/lib/messages/collections";
import {
	allArtifacts,
	artifactSummary,
	emptyArtifactFilters,
	filterArtifacts,
	isFilteringArtifacts,
} from "@/service/artifacts";
import type { ArtifactFilters } from "@/service/artifacts";
import { museumStatus } from "@/service/museum";
import type { MuseumStatus } from "@/service/museum";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { useMuseumStatusChange } from "../shared/useCollectionChanges";
import { ArtifactCard } from "./ArtifactCard";
import { ArtifactDialog } from "./ArtifactDialog";

const text = collectionsText.artifacts;
const options = text.options;

const fields: FilterFieldConfig[] = [
	{
		id: "donation",
		label: text.filter.donation,
		options: [
			{ id: "all", label: options.all },
			{ id: "donated", label: options.donated },
			{ id: "not-donated", label: options.notDonated },
		],
	},
	{
		id: "found",
		label: text.filter.found,
		options: [
			{ id: "all", label: options.all },
			{ id: "found", label: options.found },
			{ id: "not-found", label: options.notFound },
		],
	},
	{
		id: "reward",
		label: text.filter.reward,
		options: [
			{ id: "all", label: options.all },
			{ id: "has-reward", label: options.hasReward },
		],
	},
];

export function ArtifactsTab({ playthrough }: { playthrough: Playthrough }) {
	const [filters, setFilters] = useMemoryState<ArtifactFilters>(
		"collections:artifacts:filters",
		emptyArtifactFilters
	);
	const [selected, setSelected] = useState<Artifact | null>(null);
	const { data } = playthrough;

	const shown = useMemo(() => filterArtifacts(data, filters), [data, filters]);
	const summary = useMemo(() => artifactSummary(data), [data]);
	const statusOf = (artifact: Artifact) => museumStatus(data, "artifacts", artifact.id);
	const shownFound = shown.filter((artifact) => statusOf(artifact) !== "missing").length;
	const shownDonated = shown.filter((artifact) => statusOf(artifact) === "donated").length;

	const changeStatus = useMuseumStatusChange(playthrough.id, "artifacts");
	const setStatus = (artifact: Artifact, status: MuseumStatus) =>
		changeStatus(data, artifact.name, artifact.id, status);

	const clearFilters = () => setFilters(emptyArtifactFilters);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				<SummaryTile label={text.tiles.total} value={summary.total} />
				<SummaryTile
					label={text.tiles.found}
					value={summary.found.current}
					total={summary.found.total}
					emphasis
				/>
				<SummaryTile
					label={text.tiles.donated}
					value={summary.donated}
					total={summary.total}
				/>
				<SummaryTile label={text.tiles.withRewards} value={summary.withRewards} />
			</div>
			<Card className="p-4">
				<FilterBlock
					fields={fields}
					values={{ ...filters }}
					onChange={(fieldId, value) => setFilters({ ...filters, [fieldId]: value })}
					onClear={clearFilters}
					search={{
						label: text.search,
						value: filters.query,
						onChange: (query) => setFilters({ ...filters, query }),
					}}
					summary={`${collectionsText.filters.showing(shown.length, allArtifacts.length, text.noun)} · ${text.tiles.found} ${shownFound} · ${text.tiles.donated} ${shownDonated}`}
					flyoutTitle={text.sheetTitle}
					showLabel={text.apply(shown.length)}
				/>
			</Card>
			{shown.length === 0 ? (
				<EmptyState
					title={text.empty.title}
					description={text.empty.description}
					actions={
						isFilteringArtifacts(filters) ? (
							<Button onClick={clearFilters}>{text.empty.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
					{shown.map((artifact) => (
						<ArtifactCard
							key={artifact.id}
							artifact={artifact}
							status={statusOf(artifact)}
							onStatusChange={(status) => setStatus(artifact, status)}
							onOpen={() => setSelected(artifact)}
						/>
					))}
				</div>
			)}
			<ArtifactDialog
				artifact={selected}
				status={selected ? statusOf(selected) : "missing"}
				onStatusChange={(status) => selected && setStatus(selected, status)}
				onClose={() => setSelected(null)}
			/>
		</>
	);
}
