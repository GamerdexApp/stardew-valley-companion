"use client";

import { useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import {
	allLoot,
	countMonsterLootShipped,
	emptyLootFilters,
	filterLoot,
	isFilteringLoot,
	isShippableLoot,
} from "@/service/monsterLoot";
import type { LootFilters } from "@/service/monsterLoot";
import { isShipped, shippedCount } from "@/service/shipped";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { BLOCK_GRID } from "../shared/CollectionBlock";
import { QualityPrices } from "../shared/QualityPrices";
import { ShippedCorner } from "../shared/ShippedControl";
import { useShippedChange } from "../shared/useCollectionChanges";

const text = collectionsText.monsterLoot;
const options = text.options;

const fields: FilterFieldConfig[] = [
	{
		id: "shipped",
		label: text.filter.shipped,
		hint: text.shippedHint,
		options: [
			{ id: "all", label: options.all },
			{ id: "shipped", label: options.shipped },
			{ id: "not-shipped", label: options.notShipped },
			{ id: "not-shippable", label: options.notShippable },
		],
	},
];

export function MonsterLootTab({ playthrough }: { playthrough: Playthrough }) {
	const [filters, setFilters] = useMemoryState<LootFilters>(
		"collections:monster-loot:filters",
		emptyLootFilters
	);
	const { data } = playthrough;

	const shown = useMemo(() => filterLoot(data, filters), [data, filters]);
	const shipped = useMemo(() => countMonsterLootShipped(data), [data]);
	const shippedChange = useShippedChange(playthrough.id);
	const clearFilters = () => setFilters(emptyLootFilters);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
				<SummaryTile label={text.tiles.total} value={allLoot.length} />
				<SummaryTile
					label={text.tiles.shipped}
					value={shipped.current}
					total={shipped.total}
					emphasis
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
					summary={collectionsText.filters.showing(
						shown.length,
						allLoot.length,
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
						isFilteringLoot(filters) ? (
							<Button onClick={clearFilters}>{text.empty.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className={BLOCK_GRID}>
					{shown.map((loot) => (
						<Card
							key={loot.id}
							highlighted={isShipped(data, loot.id)}
							className={`flex flex-col gap-2.5 p-3 ${isShipped(data, loot.id) ? "bg-tint" : ""}`}
						>
							<div className="flex items-start gap-3">
								<img
									src={assetPath(loot.image)}
									alt=""
									className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
								/>
								<span className="min-w-0 flex-1 font-semibold">{loot.name}</span>
								{isShippableLoot(loot) && (
									<ShippedCorner
										name={loot.name}
										shipped={isShipped(data, loot.id)}
										count={shippedCount(data, loot.id)}
										onShippedChange={(value) =>
											shippedChange.setShipped(
												data,
												loot.name,
												loot.id,
												value
											)
										}
										onCountChange={(count) =>
											shippedChange.setCount(loot.id, count)
										}
									/>
								)}
							</div>
							{!isShippableLoot(loot) && (
								<p className="text-muted text-xs">{text.card.notShippable}</p>
							)}
							<div className="flex flex-col gap-1">
								<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
									{text.card.droppedBy}
								</span>
								<ul className="flex flex-wrap gap-1">
									{loot.droppedBy.map((monster) => (
										<li
											key={monster}
											className="border-line text-muted rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium"
										>
											{monster}
										</li>
									))}
								</ul>
							</div>
							<QualityPrices price={loot.sellPrice} maxQuality="base" />
						</Card>
					))}
				</div>
			)}
		</>
	);
}
