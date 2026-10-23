"use client";

import type { CraftingRecipe } from "stardew-valley-data";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { collectionsText } from "@/lib/messages/collections";
import {
	allRecipes,
	categories,
	craftingSummary,
	emptyCraftingFilters,
	filterRecipes,
	groupByCategory,
	isFilteringCrafting,
} from "@/service/crafting";
import type { CraftingFilters } from "@/service/crafting";
import { isLearned, recipeStatus } from "@/service/recipes";
import type { RecipeStatus } from "@/service/recipes";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { SummaryTile } from "../shared/SummaryTile";
import { useRecipeStatusChange } from "../shared/useCollectionChanges";
import { CraftingCard } from "./CraftingCard";
import { CraftingDialog } from "./CraftingDialog";
import { CraftingGroup } from "./CraftingGroup";

const text = collectionsText.crafting;
const options = text.options;

const fields: FilterFieldConfig[] = [
	{
		id: "status",
		label: text.filter.status,
		hint: text.statusHint,
		options: [
			{ id: "all", label: options.all },
			{ id: "crafted", label: options.crafted },
			{ id: "learned", label: options.learned },
			{ id: "not-learned", label: options.notLearned },
		],
	},
	{
		id: "category",
		label: text.filter.category,
		options: [
			{ id: "all", label: options.allCategories(categories.length) },
			...categories.map((category) => ({ id: category, label: category })),
		],
	},
];

const OPEN_BY_DEFAULT = categories.slice(0, 2);

export function CraftingTab({ playthrough }: { playthrough: Playthrough }) {
	const [filters, setFilters] = useMemoryState<CraftingFilters>(
		"collections:crafting:filters",
		emptyCraftingFilters
	);
	const [openGroups, setOpenGroups] = useMemoryState<string[]>(
		"collections:crafting:open",
		OPEN_BY_DEFAULT
	);
	const [selected, setSelected] = useState<CraftingRecipe | null>(null);
	const { data } = playthrough;

	const shown = useMemo(() => filterRecipes(data, filters), [data, filters]);
	const groups = useMemo(() => groupByCategory(data, shown), [data, shown]);
	const summary = useMemo(() => craftingSummary(data), [data]);
	const statusOf = (recipe: CraftingRecipe) => recipeStatus(data, "crafting", recipe.name);
	const shownLearned = shown.filter((recipe) => isLearned(statusOf(recipe))).length;
	const shownCrafted = shown.filter((recipe) => statusOf(recipe) === "done").length;

	// While a filter is on, every group that has a match is open, so a result is never hidden.
	const isFiltering = isFilteringCrafting(filters);
	const isOpen = (category: string) => isFiltering || openGroups.includes(category);
	const toggle = (category: string) =>
		setOpenGroups(
			openGroups.includes(category)
				? openGroups.filter((other) => other !== category)
				: [...openGroups, category]
		);

	const changeStatus = useRecipeStatusChange(playthrough.id, "crafting");
	const setStatus = (recipe: CraftingRecipe, status: RecipeStatus) =>
		changeStatus(data, recipe.name, status);
	const clearFilters = () => setFilters(emptyCraftingFilters);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
				<SummaryTile
					label={text.tiles.total}
					value={summary.total}
					caption={text.tiles.totalCaption(summary.notInCollection)}
				/>
				<SummaryTile
					label={text.tiles.learned}
					value={summary.learned}
					total={summary.crafted.total}
					emphasis
				/>
				<SummaryTile
					label={text.tiles.crafted}
					value={summary.crafted.current}
					total={summary.crafted.total}
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
					summary={`${collectionsText.filters.showing(shown.length, allRecipes.length, text.noun)} · ${text.tiles.learned.replace("Recipes ", "")} ${shownLearned} · ${text.tiles.crafted.replace("Recipes ", "")} ${shownCrafted}`}
					flyoutTitle={text.sheetTitle}
					showLabel={text.apply(shown.length)}
				/>
			</Card>
			{groups.length === 0 ? (
				<EmptyState
					title={text.empty.title}
					description={text.empty.description}
					actions={
						isFiltering ? (
							<Button onClick={clearFilters}>{text.empty.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<>
					<div className="flex flex-wrap gap-2">
						<Button onClick={() => setOpenGroups(categories)}>
							{text.groups.expandAll}
						</Button>
						<Button onClick={() => setOpenGroups([])}>{text.groups.collapseAll}</Button>
					</div>
					{groups.map((group) => (
						<CraftingGroup
							key={group.category}
							group={group}
							open={isOpen(group.category)}
							onToggle={() => toggle(group.category)}
						>
							{group.recipes.map((recipe) => (
								<CraftingCard
									key={recipe.id}
									recipe={recipe}
									status={statusOf(recipe)}
									onStatusChange={(status) => setStatus(recipe, status)}
									onOpen={() => setSelected(recipe)}
								/>
							))}
						</CraftingGroup>
					))}
				</>
			)}
			<CraftingDialog
				recipe={selected}
				status={selected ? statusOf(selected) : "not-learned"}
				onStatusChange={(status) => selected && setStatus(selected, status)}
				onClose={() => setSelected(null)}
			/>
		</>
	);
}
