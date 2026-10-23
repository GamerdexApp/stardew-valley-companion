"use client";

import type { Fish } from "stardew-valley-data";
import type { ProfessionBonus } from "stardew-valley-data";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { collectionsText } from "@/lib/messages/collections";
import { applyBestProfessionBonus, getActiveProfessionBonuses } from "@/lib/utils/professionPrices";
import { changeGameData } from "@/service/appData";
import {
	ALL,
	allFish,
	emptyFishFilters,
	filterFish,
	fishSummary,
	isCaught,
	isFilteringFish,
	locationOptions,
	setCaught,
} from "@/service/fish";
import type { FishFilters } from "@/service/fish";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { useToast } from "@/comps/ui/Toast";
import { ProfessionsControl } from "../shared/ProfessionsControl";
import { SummaryTile } from "../shared/SummaryTile";
import { FishCard } from "./FishCard";
import { FishDialog } from "./FishDialog";

const text = collectionsText.fish;
const options = text.options;

const FISH_PROFESSIONS = [
	{ id: "fisher", label: "Fisher" },
	{ id: "angler", label: "Angler" },
] as const;

interface ProfessionState {
	enabled: boolean;
	/** Null means every profession the playthrough has. */
	chosen: string[] | null;
}

const fields: FilterFieldConfig[] = [
	{
		id: "caught",
		label: text.filter.caught,

		options: [
			{ id: ALL, label: options.all },
			{ id: "caught", label: options.caught },
			{ id: "not-caught", label: options.notCaught },
		],
	},
	{
		id: "catchType",
		label: text.filter.catchType,

		options: [
			{ id: ALL, label: options.all },
			{ id: "rod", label: options.rod },
			{ id: "crab-pot", label: options.crabPot },
		],
	},
	{
		id: "season",
		label: text.filter.season,
		options: [
			{ id: ALL, label: options.allSeasons },
			{ id: "spring", label: options.spring },
			{ id: "summer", label: options.summer },
			{ id: "fall", label: options.fall },
			{ id: "winter", label: options.winter },
			{ id: "ginger-island", label: options.gingerIsland },
		],
	},
	{
		id: "weather",
		label: text.filter.weather,
		options: [
			{ id: ALL, label: options.allWeather },
			{ id: "sunny", label: options.sunny },
			{ id: "rainy", label: options.rainy },
			{ id: "both", label: options.any },
		],
	},
	{
		id: "location",
		label: text.filter.location,
		options: [
			{ id: ALL, label: options.allLocations },
			...locationOptions.map((location) => ({ id: location, label: location })),
		],
	},
	{
		id: "difficulty",
		label: text.filter.difficulty,
		options: [
			{ id: ALL, label: options.allDifficulties },
			{ id: "easy", label: options.easy },
			{ id: "medium", label: options.medium },
			{ id: "hard", label: options.hard },
			{ id: "none", label: options.none },
		],
	},
	{
		id: "categories",
		label: text.filter.category,
		kind: "chips",
		options: Object.entries(text.categories).map(([id, label]) => ({ id, label })),
	},
];

export function FishTab({ playthrough }: { playthrough: Playthrough }) {
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const [filters, setFilters] = useMemoryState<FishFilters>(
		"collections:fish:filters",
		emptyFishFilters
	);
	const [professions, setProfessions] = useMemoryState<ProfessionState>(
		"collections:fish:professions",
		{ enabled: false, chosen: null }
	);
	const [selected, setSelected] = useState<Fish | null>(null);
	const { data } = playthrough;

	const shown = useMemo(() => filterFish(data, filters), [data, filters]);
	const summary = useMemo(() => fishSummary(data), [data]);
	const shownCaught = shown.filter((fish) => isCaught(data, fish.id)).length;

	const owned = getActiveProfessionBonuses(data);
	const available = FISH_PROFESSIONS.filter((profession) => owned.has(profession.id));
	const chosenIds = professions.chosen ?? available.map((profession) => profession.id);
	const activeBonuses = new Set(
		professions.enabled ? chosenIds.filter((id) => owned.has(id as ProfessionBonus)) : []
	) as Set<ProfessionBonus>;
	const bonusFor = (fish: Fish) =>
		activeBonuses.size > 0
			? applyBestProfessionBonus(fish.sellPrice, fish.profession, activeBonuses)
			: null;

	const setFishCaught = (fish: Fish, caught: boolean) => {
		const previous = updateData((current) =>
			changeGameData(current, playthrough.id, (gameData) =>
				setCaught(gameData, fish.id, caught)
			)
		);
		if (!previous || caught) return;
		// Switching off deletes the entry with its real numbers, so Undo brings back the exact data.
		showToast({
			variant: "success",
			title: text.toast.notCaught(fish.name),
			action: { label: text.toast.undo, onAction: () => updateData(() => previous) },
		});
	};

	const clearFilters = () => setFilters(emptyFishFilters);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
				<SummaryTile
					label={text.tiles.total}
					value={summary.total}
					caption={text.tiles.totalCaption(summary.notInCollection)}
				/>
				<SummaryTile
					label={text.tiles.caught}
					value={summary.collection.current}
					total={summary.collection.total}
					emphasis
				/>
				<SummaryTile label={text.tiles.rod} value={summary.rod} />
				<SummaryTile label={text.tiles.crabPot} value={summary.crabPot} />
				{summary.seasons.map(({ season, count }) => (
					<SummaryTile key={season} label={options[season]} value={count} />
				))}
			</div>
			<ProfessionsControl
				available={[...available]}
				enabled={professions.enabled}
				chosen={chosenIds}
				onEnabledChange={(enabled) => setProfessions({ ...professions, enabled })}
				onChosenChange={(chosen) => setProfessions({ ...professions, chosen })}
			/>
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
					summary={`${collectionsText.filters.showing(shown.length, allFish.length, text.noun)} · ${text.card.caught} ${shownCaught}`}
					flyoutTitle={text.sheetTitle}
					showLabel={text.apply(shown.length)}
				/>
			</Card>
			{shown.length === 0 ? (
				<EmptyState
					title={text.empty.title}
					description={text.empty.description}
					actions={
						isFilteringFish(filters) ? (
							<Button onClick={clearFilters}>{text.empty.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
					{shown.map((fish) => (
						<FishCard
							key={fish.id}
							fish={fish}
							caught={isCaught(data, fish.id)}
							bonus={bonusFor(fish)}
							onCaughtChange={(caught) => setFishCaught(fish, caught)}
							onOpen={() => setSelected(fish)}
						/>
					))}
				</div>
			)}
			<FishDialog
				fish={selected}
				caught={selected ? isCaught(data, selected.id) : false}
				bonus={selected ? bonusFor(selected) : null}
				onCaughtChange={(caught) => selected && setFishCaught(selected, caught)}
				onClose={() => setSelected(null)}
			/>
		</>
	);
}
