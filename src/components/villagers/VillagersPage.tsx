"use client";

import { useState } from "react";
import type { Playthrough } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { villagersText } from "@/lib/messages/villagers";
import {
	allVillagers,
	emptyVillagerFilters,
	filterVillagers,
	isFilteringVillagers,
	villagersSummary,
} from "@/service/villagers";
import type { VillagerFilters } from "@/service/villagers";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { PageHeader } from "@/comps/shell/PageHeader";
import { PlaythroughGate } from "@/comps/shell/PlaythroughGate";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Section } from "@/comps/ui/Section";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { BirthdaysSection } from "./BirthdaysSection";
import { useVillagerEdits } from "./useVillagerEdits";
import { VillagerCard } from "./VillagerCard";
import { VillagerDialog } from "./VillagerDialog";

const text = villagersText;
const options = text.options;

const fields: FilterFieldConfig[] = [
	{
		id: "season",
		label: text.filter.season,
		options: [
			{ id: "all", label: options.allSeasons },
			{ id: "spring", label: options.spring },
			{ id: "summer", label: options.summer },
			{ id: "fall", label: options.fall },
			{ id: "winter", label: options.winter },
		],
	},
	{
		id: "marriage",
		label: text.filter.marriage,
		hint: text.sheetNote,
		options: [
			{ id: "all", label: options.allMarriage },
			{ id: "marriageable", label: options.marriageable },
			{ id: "non-marriageable", label: options.nonMarriageable },
		],
	},
];

function VillagersContent({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const edits = useVillagerEdits(playthrough);
	const [filters, setFilters] = useMemoryState<VillagerFilters>(
		"villagers:filters",
		emptyVillagerFilters
	);
	const [openName, setOpenName] = useState<string | null>(null);

	const summary = villagersSummary(data);
	const shown = filterVillagers(filters);
	const clearFilters = () => setFilters(emptyVillagerFilters);
	const opened = allVillagers.find((villager) => villager.name === openName);
	const farm = data.character.farmName;

	return (
		<>
			<PageHeader
				title={text.title}
				subline={text.subline(farm ? `${farm} Farm` : playthrough.name)}
			/>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
				<SummaryTile label={text.tiles.total} value={summary.total} />
				<SummaryTile
					label={text.tiles.max}
					value={summary.maxed}
					total={summary.total}
					emphasis={summary.maxed === summary.total}
				/>
				<SummaryTile label={text.tiles.tenPlus} value={summary.tenPlus} />
				<SummaryTile label={text.tiles.fivePlus} value={summary.fivePlus} />
				<SummaryTile
					label={text.tiles.events}
					value={summary.eventsSeen}
					total={summary.eventsTotal}
				/>
				<SummaryTile
					label={text.tiles.spouse}
					value={summary.spouse || text.tiles.noSpouse}
				/>
			</div>
			<Section
				title={text.section.title}
				badge={text.section.badge(summary.maxed, summary.total)}
			>
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
					summary={text.showing(shown.length, summary.total, summary.maxed)}
					flyoutTitle={text.sheetTitle}
					showLabel={text.apply(shown.length)}
				/>
				{shown.length === 0 ? (
					<EmptyState
						title={text.empty}
						description=""
						actions={
							isFilteringVillagers(filters) ? (
								<Button onClick={clearFilters}>{text.clear}</Button>
							) : undefined
						}
					/>
				) : (
					<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
						{shown.map((villager) => (
							<VillagerCard
								key={villager.id}
								villager={villager}
								data={data}
								onHearts={(hearts) => edits.hearts(villager.name, hearts)}
								onStatus={(status) => edits.status(villager.name, status)}
								onOpen={() => setOpenName(villager.name)}
							/>
						))}
					</div>
				)}
			</Section>
			<BirthdaysSection data={data} />
			{opened && (
				<VillagerDialog
					villager={opened}
					data={data}
					onClose={() => setOpenName(null)}
					onHearts={(hearts) => edits.hearts(opened.name, hearts)}
					onStatus={(status) => edits.status(opened.name, status)}
					onEvent={(event, seen) => edits.eventSeen(opened.name, event, seen)}
					onTrack={(item, preference, tracked) =>
						edits.tracking(opened.name, item, preference, tracked)
					}
				/>
			)}
		</>
	);
}

export function VillagersPage() {
	return (
		<PlaythroughGate title={text.title}>
			{(playthrough) => <VillagersContent playthrough={playthrough} />}
		</PlaythroughGate>
	);
}
