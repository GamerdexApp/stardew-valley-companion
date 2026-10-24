"use client";

import type { SpecialItem } from "stardew-valley-data";
import Link from "next/link";
import { useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import { changeGameData } from "@/service/appData";
import {
	allSpecialItems,
	emptySpecialItemFilters,
	filterSpecialItems,
	isEditableItem,
	isFilteringSpecialItems,
	setSpecialItemAcquired,
	specialItemsSummary,
	specialItemState,
} from "@/service/specialItems";
import type { SpecialItemFilters } from "@/service/specialItems";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { ExpandableDetails } from "@/comps/ui/ExpandableDetails";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { Switch } from "@/comps/ui/Switch";
import { BLOCK_GRID } from "../shared/CollectionBlock";

const text = collectionsText.specialItems;
const options = text.options;

const fields: FilterFieldConfig[] = [
	{
		id: "type",
		label: text.filter.type,
		options: [
			{ id: "all", label: options.all },
			{ id: "special-item", label: options.specialItems },
			{ id: "book", label: options.books },
			{ id: "skill-book", label: options.skillBooks },
			{ id: "mastery", label: options.mastery },
		],
	},
	{
		id: "status",
		label: text.filter.status,
		hint: text.statusHint,
		options: [
			{ id: "all", label: options.all },
			{ id: "acquired", label: options.acquired },
			{ id: "not-acquired", label: options.notAcquired },
		],
	},
];

const chip = "border-line text-muted rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium";

export function SpecialItemsTab({ playthrough }: { playthrough: Playthrough }) {
	const { updateData } = usePlaythrough();
	const [filters, setFilters] = useMemoryState<SpecialItemFilters>(
		"collections:special-items:filters",
		emptySpecialItemFilters
	);
	const { data } = playthrough;

	const shown = useMemo(() => filterSpecialItems(data, filters), [data, filters]);
	const summary = useMemo(() => specialItemsSummary(data), [data]);
	const clearFilters = () => setFilters(emptySpecialItemFilters);
	const change = (item: SpecialItem, acquired: boolean) =>
		updateData((current) =>
			changeGameData(current, playthrough.id, (gameData) =>
				setSpecialItemAcquired(gameData, item, acquired)
			)
		);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				<SummaryTile
					label={text.tiles.specialItems}
					value={summary.specialItems.current}
					total={summary.specialItems.total}
				/>
				<SummaryTile
					label={text.tiles.books}
					value={summary.books.current}
					total={summary.books.total}
				/>
				<SummaryTile
					label={text.tiles.mastery}
					value={summary.mastery.current}
					total={summary.mastery.total}
				/>
				<SummaryTile
					label={text.tiles.total}
					value={summary.total.current}
					total={summary.total.total}
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
						allSpecialItems.length,
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
						isFilteringSpecialItems(filters) ? (
							<Button onClick={clearFilters}>{text.empty.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className={BLOCK_GRID}>
					{shown.map((item) => {
						const state = specialItemState(data, item);
						const acquired = state === "acquired";
						return (
							<Card
								key={item.id}
								highlighted={acquired}
								className={`flex flex-col gap-2.5 p-3 ${acquired ? "bg-tint" : ""}`}
							>
								<div className="flex items-start gap-3">
									<img
										loading="lazy"
										decoding="async"
										src={assetPath(item.image)}
										alt=""
										className={`size-12 shrink-0 object-contain [image-rendering:pixelated] ${state === "missing" ? "opacity-50 grayscale" : ""}`}
									/>
									<div className="flex min-w-0 flex-1 flex-col gap-1 break-words">
										<span className="font-semibold">{item.name}</span>
										<span className={`${chip} self-start`}>
											{text.kind[item.type]}
										</span>
									</div>
									<div className="flex shrink-0 flex-col items-end gap-1">
										{isEditableItem(item) && (
											<Switch
												checked={acquired}
												onChange={(value) => change(item, value)}
												label={text.card.switchLabel(item.name)}
											/>
										)}
										<span
											className={`text-xs font-medium ${acquired ? "text-kept" : "text-muted"}`}
										>
											{state === "info"
												? text.card.info
												: acquired
													? text.card.acquired
													: text.card.notAcquired}
										</span>
									</div>
								</div>
								{item.type === "mastery" && (
									<Link
										href="/farm/character"
										className="text-link flex min-h-11 items-center self-start text-xs font-semibold underline-offset-2 hover:underline lg:min-h-6"
									>
										{text.card.masteryNote} · {text.card.character}
									</Link>
								)}
								<p className="text-muted text-xs">{item.effect}</p>
								<ExpandableDetails
									showLabel={text.card.showDetails}
									hideLabel={text.card.hideDetails}
								>
									<div className="flex flex-col gap-1">
										<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
											{text.card.effect}
										</span>
										<p>{item.effect}</p>
									</div>
									<div className="flex flex-col gap-1">
										<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
											{text.card.howToObtain}
										</span>
										<p>{item.obtainedFrom}</p>
									</div>
								</ExpandableDetails>
							</Card>
						);
					})}
				</div>
			)}
		</>
	);
}
