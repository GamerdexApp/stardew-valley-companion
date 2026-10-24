"use client";

import type { ArtisanGood } from "stardew-valley-data";
import { useMemo, useState } from "react";
import type { Playthrough } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { useProfessionPrices } from "@/lib/hooks/useProfessionPrices";
import { collectionsText } from "@/lib/messages/collections";
import {
	allGoods,
	artisanGoodsSummary,
	emptyGoodFilters,
	filterGoods,
	hasFixedPrice,
	isFilteringGoods,
} from "@/service/artisanGoods";
import type { GoodFilters } from "@/service/artisanGoods";
import { isShipped, shippedCount } from "@/service/shipped";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { BLOCK_GRID } from "../shared/CollectionBlock";
import { ProfessionsControl } from "../shared/ProfessionsControl";
import { useShippedChange } from "../shared/useCollectionChanges";
import { ArtisanGoodCard } from "./ArtisanGoodCard";
import { PriceCalculatorDialog } from "./PriceCalculatorDialog";

const text = collectionsText.artisanGoods;
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

export function ArtisanGoodsTab({ playthrough }: { playthrough: Playthrough }) {
	const [filters, setFilters] = useMemoryState<GoodFilters>(
		"collections:artisan-goods:filters",
		emptyGoodFilters
	);
	const [calculating, setCalculating] = useState<ArtisanGood | null>(null);
	const { data } = playthrough;

	const shown = useMemo(() => filterGoods(data, filters), [data, filters]);
	const summary = useMemo(() => artisanGoodsSummary(data), [data]);
	const professions = useProfessionPrices(
		"collections:artisan-goods:professions",
		data,
		text.professions
	);
	const shippedChange = useShippedChange(playthrough.id);
	const clearFilters = () => setFilters(emptyGoodFilters);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
				<SummaryTile label={text.tiles.equipment} value={summary.equipment} />
				<SummaryTile label={text.tiles.goods} value={summary.goods} />
				<SummaryTile
					label={text.tiles.shipped}
					value={summary.shipped.current}
					total={summary.shipped.total}
					emphasis
				/>
			</div>
			<ProfessionsControl {...professions.control} />
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
						allGoods.length,
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
						isFilteringGoods(filters) ? (
							<Button onClick={clearFilters}>{text.empty.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className={BLOCK_GRID}>
					{shown.map((good) => (
						<ArtisanGoodCard
							key={good.id}
							good={good}
							shipped={isShipped(data, good.id)}
							count={shippedCount(data, good.id)}
							bonuses={
								hasFixedPrice(good)
									? professions.rowsFor(good.sellPrice!, good.profession)
									: []
							}
							onShippedChange={(shipped) =>
								shippedChange.setShipped(data, good.name, good.id, shipped)
							}
							onCountChange={(count) => shippedChange.setCount(good.id, count)}
							onCalculate={() => setCalculating(good)}
						/>
					))}
				</div>
			)}
			<PriceCalculatorDialog
				good={calculating}
				professionsOn={
					professions.control.enabled && professions.control.available.length > 0
				}
				bonusesFor={(good, price) => professions.rowsFor(price, good.profession)}
				onClose={() => setCalculating(null)}
			/>
		</>
	);
}
