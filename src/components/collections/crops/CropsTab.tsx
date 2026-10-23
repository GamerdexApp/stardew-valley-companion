"use client";

import { useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { useProfessionPrices } from "@/lib/hooks/useProfessionPrices";
import { collectionsText } from "@/lib/messages/collections";
import {
	allCrops,
	cropsSummary,
	emptyCropFilters,
	filterCrops,
	isFilteringCrops,
} from "@/service/crops";
import type { CropFilters } from "@/service/crops";
import { isShipped, shippedCount } from "@/service/shipped";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { ProfessionsControl } from "../shared/ProfessionsControl";
import { SummaryTile } from "../shared/SummaryTile";
import { useShippedChange } from "../shared/useCollectionChanges";
import { CropCard } from "./CropCard";

const text = collectionsText.crops;
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
		id: "shipped",
		label: text.filter.shipped,
		options: [
			{ id: "all", label: options.all },
			{ id: "shipped", label: options.shipped },
			{ id: "not-shipped", label: options.notShipped },
		],
	},
	{
		id: "regrowth",
		label: text.filter.regrowth,
		options: [
			{ id: "all", label: options.all },
			{ id: "regrowing", label: options.regrowing },
			{ id: "non-regrowing", label: options.nonRegrowing },
		],
	},
	{
		id: "trellis",
		label: text.filter.trellis,
		options: [
			{ id: "all", label: options.all },
			{ id: "trellis", label: options.trellis },
			{ id: "no-trellis", label: options.noTrellis },
		],
	},
	{
		id: "giant",
		label: text.filter.giant,
		options: [
			{ id: "all", label: options.all },
			{ id: "giant", label: options.giant },
			{ id: "no-giant", label: options.noGiant },
		],
	},
];

export function CropsTab({ playthrough }: { playthrough: Playthrough }) {
	const [filters, setFilters] = useMemoryState<CropFilters>(
		"collections:crops:filters",
		emptyCropFilters
	);
	const { data } = playthrough;

	const shown = useMemo(() => filterCrops(data, filters), [data, filters]);
	const summary = useMemo(() => cropsSummary(data), [data]);
	const professions = useProfessionPrices(
		"collections:crops:professions",
		data,
		text.professions
	);
	const shippedChange = useShippedChange(playthrough.id);
	const clearFilters = () => setFilters(emptyCropFilters);
	const shownShipped = shown.filter((crop) => isShipped(data, crop.id)).length;

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
				<SummaryTile label={text.tiles.total} value={summary.total} />
				<SummaryTile label={text.tiles.regrowing} value={summary.regrowing} />
				<SummaryTile
					label={text.tiles.shipped}
					value={summary.shipped.current}
					total={summary.shipped.total}
					emphasis
				/>
				<SummaryTile label={text.tiles.shippedFifteen} value={summary.shippedFifteen} />
				<SummaryTile
					label={text.tiles.shippedThreeHundred}
					value={summary.shippedThreeHundred}
				/>
				{summary.seasons.map(({ season, count }) => (
					<SummaryTile key={season} label={options[season]} value={count} />
				))}
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
					summary={`${collectionsText.filters.showing(shown.length, allCrops.length, text.noun)} · ${options.shipped} ${shownShipped}`}
					flyoutTitle={text.sheetTitle}
					showLabel={text.apply(shown.length)}
				/>
			</Card>
			{shown.length === 0 ? (
				<EmptyState
					title={text.empty.title}
					description={text.empty.description}
					actions={
						isFilteringCrops(filters) ? (
							<Button onClick={clearFilters}>{text.empty.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
					{shown.map((crop) => (
						<CropCard
							key={crop.id}
							crop={crop}
							shipped={isShipped(data, crop.id)}
							count={shippedCount(data, crop.id)}
							bonus={professions.bonusFor(crop.cropSellPrice, crop.profession)}
							onShippedChange={(shipped) =>
								shippedChange.setShipped(data, crop.name, crop.id, shipped)
							}
							onCountChange={(count) => shippedChange.setCount(crop.id, count)}
						/>
					))}
				</div>
			)}
		</>
	);
}
