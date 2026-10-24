"use client";

import { useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { useProfessionPrices } from "@/lib/hooks/useProfessionPrices";
import { collectionsText } from "@/lib/messages/collections";
import {
	allForageItems,
	allTrees,
	emptyForageFilters,
	emptyTreeFilters,
	filterForageItems,
	filterTrees,
	forageSummary,
	isFilteringForage,
	isFilteringTrees,
	treeProduce,
} from "@/service/forageables";
import type { ForageFilters, TreeFilters } from "@/service/forageables";
import { isShipped, shippedCount } from "@/service/shipped";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { BLOCK_GRID, CollectionBlock } from "../shared/CollectionBlock";
import { ProfessionsControl } from "../shared/ProfessionsControl";
import { useShippedChange } from "../shared/useCollectionChanges";
import { ForageItemCard } from "./ForageItemCard";
import { TreeCard } from "./TreeCard";

const text = collectionsText.forageables;
const options = text.options;

const itemFields: FilterFieldConfig[] = [
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
		id: "shipped",
		label: text.filter.shipped,
		hint: text.shippedHint,
		options: [
			{ id: "all", label: options.all },
			{ id: "shipped", label: options.shipped },
			{ id: "not-shipped", label: options.notShipped },
			{ id: "other", label: options.other },
		],
	},
];

const treeFields: FilterFieldConfig[] = [
	{
		id: "type",
		label: text.filter.type,
		options: [
			{ id: "all", label: options.all },
			{ id: "fruit-tree", label: options.fruitTrees },
			{ id: "wild-tree", label: options.wildTrees },
		],
	},
];

export function ForageablesTab({ playthrough }: { playthrough: Playthrough }) {
	const [filters, setFilters] = useMemoryState<ForageFilters>(
		"collections:forageables:filters",
		emptyForageFilters
	);
	const [treeFilters, setTreeFilters] = useMemoryState<TreeFilters>(
		"collections:forageables:trees",
		emptyTreeFilters
	);
	const { data } = playthrough;

	const shown = useMemo(() => filterForageItems(data, filters), [data, filters]);
	const shownTrees = useMemo(() => filterTrees(treeFilters), [treeFilters]);
	const summary = useMemo(() => forageSummary(data), [data]);
	const professions = useProfessionPrices(
		"collections:forageables:professions",
		data,
		text.professions
	);
	const shippedChange = useShippedChange(playthrough.id);
	const clearFilters = () => setFilters(emptyForageFilters);
	const clearTreeFilters = () => setTreeFilters(emptyTreeFilters);

	const fruitShown = shownTrees.filter((tree) => tree.type === "fruit-tree");
	const wildShown = shownTrees.filter((tree) => tree.type === "wild-tree");

	const treeCard = (tree: (typeof allTrees)[number]) => {
		const produce = treeProduce(tree);
		return (
			<TreeCard
				key={tree.id}
				tree={tree}
				shippedCount={produce ? shippedCount(data, produce.id) : 0}
				bonus={produce ? professions.bonusFor(produce.sellPrice, produce.profession) : null}
			/>
		);
	};

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
				<SummaryTile label={text.tiles.items} value={summary.items} />
				<SummaryTile
					label={text.tiles.shipped}
					value={summary.shipped.current}
					total={summary.shipped.total}
					emphasis
				/>
				<SummaryTile label={text.tiles.trees} value={summary.trees} />
				<SummaryTile label={text.tiles.fruitTrees} value={summary.fruitTrees} />
				<SummaryTile label={text.tiles.wildTrees} value={summary.wildTrees} />
				{summary.seasons.map(({ season, count }) => (
					<SummaryTile key={season} label={options[season]} value={count} />
				))}
			</div>
			<ProfessionsControl {...professions.control} />
			<CollectionBlock
				id="forageables-items"
				title={text.blocks.items}
				badge={`${summary.shipped.current} / ${summary.shipped.total}`}
			>
				<Card className="p-4">
					<FilterBlock
						fields={itemFields}
						values={{ ...filters }}
						onChange={(fieldId, value) => setFilters({ ...filters, [fieldId]: value })}
						onClear={clearFilters}
						search={{
							label: text.search,
							value: filters.query,
							onChange: (query) => setFilters({ ...filters, query }),
						}}
						summary={collectionsText.filters.showing(
							shown.length,
							allForageItems.length,
							text.noun
						)}
						flyoutTitle={text.sheetTitle}
						showLabel={text.apply(shown.length)}
					/>
				</Card>
				{shown.length === 0 ? (
					<EmptyState
						title={text.empty.title}
						description={text.empty.description}
						actions={
							isFilteringForage(filters) ? (
								<Button onClick={clearFilters}>{text.empty.clear}</Button>
							) : undefined
						}
					/>
				) : (
					<div className={BLOCK_GRID}>
						{shown.map((item) => (
							<ForageItemCard
								key={item.id}
								item={item}
								shipped={isShipped(data, item.id)}
								count={shippedCount(data, item.id)}
								bonus={professions.bonusFor(
									item.sellPrice,
									item.profession,
									item.knowledge
								)}
								onShippedChange={(shipped) =>
									shippedChange.setShipped(data, item.name, item.id, shipped)
								}
								onCountChange={(count) => shippedChange.setCount(item.id, count)}
							/>
						))}
					</div>
				)}
			</CollectionBlock>
			<CollectionBlock
				id="forageables-trees"
				title={text.blocks.trees}
				badge={text.trees.badge(allTrees.length)}
			>
				<Card className="p-4">
					<FilterBlock
						fields={treeFields}
						values={{ ...treeFilters }}
						onChange={(fieldId, value) =>
							setTreeFilters({ ...treeFilters, [fieldId]: value })
						}
						onClear={clearTreeFilters}
						search={{
							label: text.trees.search,
							value: treeFilters.query,
							onChange: (query) => setTreeFilters({ ...treeFilters, query }),
						}}
						summary={collectionsText.filters.showing(
							shownTrees.length,
							allTrees.length,
							text.trees.badge(0).replace("0 ", "")
						)}
						flyoutTitle={text.trees.sheetTitle}
						showLabel={text.trees.apply(shownTrees.length)}
					/>
				</Card>
				{shownTrees.length === 0 ? (
					<EmptyState
						title={text.trees.empty.title}
						description={text.trees.empty.description}
						actions={
							isFilteringTrees(treeFilters) ? (
								<Button onClick={clearTreeFilters}>{text.empty.clear}</Button>
							) : undefined
						}
					/>
				) : (
					<>
						{fruitShown.length > 0 && (
							<section className="flex flex-col gap-3">
								<h3 className="text-muted font-mono text-xs tracking-[0.08em] uppercase">
									{text.trees.groupFruit(fruitShown.length)}
								</h3>
								<div className={BLOCK_GRID}>{fruitShown.map(treeCard)}</div>
							</section>
						)}
						{wildShown.length > 0 && (
							<section className="flex flex-col gap-3">
								<h3 className="text-muted font-mono text-xs tracking-[0.08em] uppercase">
									{text.trees.groupWild(wildShown.length)}
								</h3>
								<div className={BLOCK_GRID}>{wildShown.map(treeCard)}</div>
							</section>
						)}
					</>
				)}
			</CollectionBlock>
		</>
	);
}
