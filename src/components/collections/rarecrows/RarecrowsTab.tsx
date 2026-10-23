"use client";

import { useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import { changeGameData } from "@/service/appData";
import {
	allRarecrows,
	countRarecrowsObtained,
	emptyRarecrowFilters,
	filterRarecrows,
	isFilteringRarecrows,
	isObtained,
	setObtained,
} from "@/service/rarecrows";
import type { RarecrowFilters } from "@/service/rarecrows";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Switch } from "@/comps/ui/Switch";
import { BLOCK_GRID } from "../shared/CollectionBlock";
import { SummaryTile } from "../shared/SummaryTile";

const text = collectionsText.rarecrows;
const options = text.options;

const fields: FilterFieldConfig[] = [
	{
		id: "status",
		label: text.filter.status,
		options: [
			{ id: "all", label: options.all },
			{ id: "obtained", label: options.obtained },
			{ id: "missing", label: options.missing },
		],
	},
];

export function RarecrowsTab({ playthrough }: { playthrough: Playthrough }) {
	const { updateData } = usePlaythrough();
	const [filters, setFilters] = useMemoryState<RarecrowFilters>(
		"collections:rarecrows:filters",
		emptyRarecrowFilters
	);
	const { data } = playthrough;

	const shown = useMemo(() => filterRarecrows(data, filters), [data, filters]);
	const count = useMemo(() => countRarecrowsObtained(data), [data]);
	const clearFilters = () => setFilters(emptyRarecrowFilters);
	const change = (id: string, obtained: boolean) =>
		updateData((current) =>
			changeGameData(current, playthrough.id, (gameData) =>
				setObtained(gameData, id, obtained)
			)
		);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
				<SummaryTile
					label={text.tiles.obtained}
					value={count.current}
					total={count.total}
					emphasis
				/>
				<SummaryTile label={text.tiles.remaining} value={count.total - count.current} />
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
						allRarecrows.length,
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
						isFilteringRarecrows(filters) ? (
							<Button onClick={clearFilters}>{text.empty.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className={BLOCK_GRID}>
					{shown.map((rarecrow) => {
						const obtained = isObtained(data, rarecrow.id);
						return (
							<Card
								key={rarecrow.id}
								highlighted={obtained}
								className={`flex flex-col gap-2.5 p-3 ${obtained ? "bg-tint" : ""}`}
							>
								<div className="flex items-start gap-3">
									<img
										src={assetPath(rarecrow.image)}
										alt=""
										className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
									/>
									<span className="min-w-0 flex-1 font-semibold">
										{rarecrow.name}
									</span>
									<div className="flex shrink-0 flex-col items-end gap-1">
										<Switch
											checked={obtained}
											onChange={(value) => change(rarecrow.id, value)}
											label={text.card.switchLabel(rarecrow.name)}
										/>
										<span
											className={`text-xs font-medium ${obtained ? "text-kept" : "text-muted"}`}
										>
											{obtained ? text.card.obtained : text.card.missing}
										</span>
									</div>
								</div>
								<p className="text-muted text-xs">{rarecrow.obtain}</p>
							</Card>
						);
					})}
				</div>
			)}
		</>
	);
}
