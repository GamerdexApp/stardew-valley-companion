"use client";

import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { townText } from "@/lib/messages/town";
import {
	ALL_CATEGORIES,
	allLocations,
	categories,
	emptyTownFilters,
	filterLocations,
	isFilteringTown,
	islandUnlocks,
	shopCount,
	valleyUnlocks,
} from "@/service/town";
import type { TownFilters } from "@/service/town";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { PageHeader } from "@/comps/shell/PageHeader";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Section } from "@/comps/ui/Section";
import { LocationCard } from "./LocationCard";
import { UnlockCard } from "./UnlockCard";

const text = townText;

const fields: FilterFieldConfig[] = [
	{
		id: "show",
		label: text.filter.show,
		options: (["all", "shops", "locations"] as const).map((id) => ({
			id,
			label: text.filter.shows[id],
		})),
	},
	{
		id: "category",
		label: text.filter.category,
		options: [
			{ id: ALL_CATEGORIES, label: text.filter.allCategories },
			...categories.map((category) => ({ id: category, label: category })),
		],
	},
];

export function TownPage() {
	const { activePlaythrough } = usePlaythrough();
	const [filters, setFilters] = useMemoryState<TownFilters>("town:filters", emptyTownFilters);
	const shown = filterLocations(filters);
	const shownShops = shown.filter((location) => location.shop).length;
	const clearFilters = () => setFilters(emptyTownFilters);

	return (
		<>
			<PageHeader title={text.title} subline={text.subline(allLocations.length, shopCount)} />
			{activePlaythrough && (
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<UnlockCard
						title={text.unlocks.valley}
						note={text.unlocks.valleyNote}
						unlocks={valleyUnlocks(activePlaythrough.data)}
						onLabel={text.unlocks.unlocked}
						offLabel={text.unlocks.locked}
					/>
					<UnlockCard
						title={text.unlocks.island}
						note={text.unlocks.islandNote}
						unlocks={islandUnlocks(activePlaythrough.data)}
						onLabel={text.unlocks.built}
						offLabel={text.unlocks.notBuilt}
					/>
				</div>
			)}
			<FilterBlock
				fields={fields}
				values={{ show: filters.show, category: filters.category }}
				onChange={(fieldId, value) => setFilters({ ...filters, [fieldId]: value })}
				onClear={clearFilters}
				search={{
					label: text.search,
					value: filters.query,
					onChange: (query) => setFilters({ ...filters, query }),
				}}
				summary={text.showing(shown.length, allLocations.length, shownShops)}
				flyoutTitle={text.filter.sheetTitle}
				showLabel={text.filter.apply(shown.length)}
			/>
			{shown.length === 0 ? (
				<EmptyState
					title={text.empty}
					description=""
					actions={
						isFilteringTown(filters) ? (
							<Button onClick={clearFilters}>{text.clear}</Button>
						) : undefined
					}
				/>
			) : (
				categories
					.filter((category) => shown.some((location) => location.category === category))
					.map((category) => {
						const inCategory = shown.filter(
							(location) => location.category === category
						);
						return (
							<Section
								key={category}
								title={category}
								badge={text.category.badge(inCategory.length)}
							>
								<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
									{inCategory.map((location) => (
										<LocationCard key={location.id} location={location} />
									))}
								</div>
							</Section>
						);
					})
			)}
		</>
	);
}
