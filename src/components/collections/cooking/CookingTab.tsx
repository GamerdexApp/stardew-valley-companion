"use client";

import type { CookedDish } from "stardew-valley-data";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { collectionsText } from "@/lib/messages/collections";
import {
	allDishes,
	cookingSummary,
	emptyCookingFilters,
	filterDishes,
	isFilteringCooking,
} from "@/service/cooking";
import type { CookingFilters } from "@/service/cooking";
import { isLearned, recipeStatus } from "@/service/recipes";
import type { RecipeStatus } from "@/service/recipes";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { SummaryTile } from "../shared/SummaryTile";
import { useRecipeStatusChange } from "../shared/useCollectionChanges";
import { CookingCard } from "./CookingCard";
import { CookingDialog } from "./CookingDialog";

const text = collectionsText.cooking;
const options = text.options;

const fields: FilterFieldConfig[] = [
	{
		id: "status",
		label: text.filter.status,
		hint: text.statusHint,
		options: [
			{ id: "all", label: options.all },
			{ id: "cooked", label: options.cooked },
			{ id: "learned", label: options.learned },
			{ id: "not-learned", label: options.notLearned },
		],
	},
	{
		id: "source",
		label: text.filter.source,
		options: [
			{ id: "all", label: options.all },
			{ id: "queen-of-sauce", label: options.queenOfSauce },
			{ id: "friendship", label: options.friendship },
			{ id: "purchase", label: options.purchase },
			{ id: "skill", label: options.skill },
			{ id: "default", label: options.default },
			{ id: "cutscene", label: options.cutscene },
		],
	},
];

export function CookingTab({ playthrough }: { playthrough: Playthrough }) {
	const [filters, setFilters] = useMemoryState<CookingFilters>(
		"collections:cooking:filters",
		emptyCookingFilters
	);
	const [selected, setSelected] = useState<CookedDish | null>(null);
	const { data } = playthrough;

	const shown = useMemo(() => filterDishes(data, filters), [data, filters]);
	const summary = useMemo(() => cookingSummary(data), [data]);
	const statusOf = (dish: CookedDish) => recipeStatus(data, "cooking", dish.name);
	const shownLearned = shown.filter((dish) => isLearned(statusOf(dish))).length;
	const shownCooked = shown.filter((dish) => statusOf(dish) === "done").length;

	const changeStatus = useRecipeStatusChange(playthrough.id, "cooking");
	const setStatus = (dish: CookedDish, status: RecipeStatus) =>
		changeStatus(data, dish.name, status);
	const clearFilters = () => setFilters(emptyCookingFilters);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
				<SummaryTile label={text.tiles.total} value={summary.total} />
				<SummaryTile
					label={text.tiles.learned}
					value={summary.learned}
					total={summary.total}
					emphasis
				/>
				<SummaryTile
					label={text.tiles.cooked}
					value={summary.cooked.current}
					total={summary.cooked.total}
				/>
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
					summary={`${collectionsText.filters.showing(shown.length, allDishes.length, text.noun)} · ${text.tiles.learned.replace("Recipes ", "")} ${shownLearned} · ${text.tiles.cooked.replace("Recipes ", "")} ${shownCooked}`}
					flyoutTitle={text.sheetTitle}
					showLabel={text.apply(shown.length)}
				/>
			</Card>
			{shown.length === 0 ? (
				<EmptyState
					title={text.empty.title}
					description={text.empty.description}
					actions={
						isFilteringCooking(filters) ? (
							<Button onClick={clearFilters}>{text.empty.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
					{shown.map((dish) => (
						<CookingCard
							key={dish.id}
							dish={dish}
							status={statusOf(dish)}
							onStatusChange={(status) => setStatus(dish, status)}
							onOpen={() => setSelected(dish)}
						/>
					))}
				</div>
			)}
			<CookingDialog
				dish={selected}
				status={selected ? statusOf(selected) : "not-learned"}
				onStatusChange={(status) => selected && setStatus(selected, status)}
				onClose={() => setSelected(null)}
			/>
		</>
	);
}
