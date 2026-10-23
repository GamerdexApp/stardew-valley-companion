"use client";

import { useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { useProfessionPrices } from "@/lib/hooks/useProfessionPrices";
import { collectionsText } from "@/lib/messages/collections";
import {
	allProduce,
	animalProductsSummary,
	emptyProduceFilters,
	filterProduce,
	isFilteringProduce,
} from "@/service/animalProducts";
import type { ProduceFilters } from "@/service/animalProducts";
import { isShipped, shippedCount } from "@/service/shipped";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { BLOCK_GRID } from "../shared/CollectionBlock";
import { ProfessionsControl } from "../shared/ProfessionsControl";
import { SummaryTile } from "../shared/SummaryTile";
import { useShippedChange } from "../shared/useCollectionChanges";
import { ProduceCard } from "./ProduceCard";

const text = collectionsText.animalProducts;
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
			{ id: "not-tracked", label: options.notTracked },
		],
	},
];

export function AnimalProductsTab({ playthrough }: { playthrough: Playthrough }) {
	const [filters, setFilters] = useMemoryState<ProduceFilters>(
		"collections:animal-products:filters",
		emptyProduceFilters
	);
	const { data } = playthrough;

	const shown = useMemo(() => filterProduce(data, filters), [data, filters]);
	const summary = useMemo(() => animalProductsSummary(data), [data]);
	const professions = useProfessionPrices(
		"collections:animal-products:professions",
		data,
		text.professions
	);
	const shippedChange = useShippedChange(playthrough.id);
	const clearFilters = () => setFilters(emptyProduceFilters);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
				<SummaryTile label={text.tiles.animals} value={summary.animals} />
				<SummaryTile label={text.tiles.items} value={summary.items} />
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
						allProduce.length,
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
						isFilteringProduce(filters) ? (
							<Button onClick={clearFilters}>{text.empty.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className={BLOCK_GRID}>
					{shown.map((produce) => (
						<ProduceCard
							key={produce.id}
							produce={produce}
							shipped={isShipped(data, produce.id)}
							count={shippedCount(data, produce.id)}
							bonus={professions.bonusFor(produce.sellPrice, produce.profession)}
							onShippedChange={(shipped) =>
								shippedChange.setShipped(data, produce.name, produce.id, shipped)
							}
							onCountChange={(count) => shippedChange.setCount(produce.id, count)}
						/>
					))}
				</div>
			)}
		</>
	);
}
