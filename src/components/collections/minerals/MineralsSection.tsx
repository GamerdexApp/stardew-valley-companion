"use client";

import type { MineralItem } from "stardew-valley-data";
import { useMemo, useState } from "react";
import type { GameData } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import type { BonusResult } from "@/lib/utils/professionPrices";
import {
	allMinerals,
	emptyMineralFilters,
	filterMinerals,
	geodesHolding,
	isFilteringMinerals,
} from "@/service/minerals";
import type { MineralFilters } from "@/service/minerals";
import { museumStatus } from "@/service/museum";
import type { MuseumStatus } from "@/service/museum";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { BLOCK_GRID, CollectionBlock, DetailsButton } from "../shared/CollectionBlock";
import { DialogSection, ItemDialog, TextList } from "../shared/ItemDialog";
import { MuseumStatusControl } from "../shared/MuseumStatusControl";
import { QualityPrices } from "../shared/QualityPrices";

const text = collectionsText.minerals;
const options = text.options;

const fields: FilterFieldConfig[] = [
	{
		id: "donation",
		label: text.filter.donation,
		options: [
			{ id: "all", label: options.all },
			{ id: "donated", label: options.donated },
			{ id: "not-donated", label: options.notDonated },
		],
	},
	{
		id: "found",
		label: text.filter.found,
		options: [
			{ id: "all", label: options.all },
			{ id: "found", label: options.found },
			{ id: "not-found", label: options.notFound },
		],
	},
];

interface MineralsSectionProps {
	data: GameData;
	bonusFor: (mineral: MineralItem) => BonusResult | null;
	onStatusChange: (mineral: MineralItem, status: MuseumStatus) => void;
}

function GeodeChips({ names }: { names: string[] }) {
	if (names.length === 0) return null;
	return (
		<ul className="flex flex-wrap gap-1">
			{names.map((name) => (
				<li
					key={name}
					className="border-line text-muted rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium"
				>
					{name}
				</li>
			))}
		</ul>
	);
}

export function MineralsSection({ data, bonusFor, onStatusChange }: MineralsSectionProps) {
	const [filters, setFilters] = useMemoryState<MineralFilters>(
		"collections:minerals:minerals",
		emptyMineralFilters
	);
	const [selected, setSelected] = useState<MineralItem | null>(null);

	const shown = useMemo(() => filterMinerals(data, filters), [data, filters]);
	const statusOf = (mineral: MineralItem) => museumStatus(data, "minerals", mineral.id);
	const donated = allMinerals.filter((mineral) => statusOf(mineral) === "donated").length;
	const clearFilters = () => setFilters(emptyMineralFilters);

	return (
		<CollectionBlock
			id="minerals-minerals"
			title={text.blocks.minerals}
			badge={text.badge.donated(donated, allMinerals.length)}
		>
			<Card className="p-4">
				<FilterBlock
					fields={fields}
					values={{ ...filters }}
					onChange={(fieldId, value) => setFilters({ ...filters, [fieldId]: value })}
					onClear={clearFilters}
					search={{
						label: text.search.minerals,
						value: filters.query,
						onChange: (query) => setFilters({ ...filters, query }),
					}}
					summary={collectionsText.filters.showing(
						shown.length,
						allMinerals.length,
						text.nouns.minerals
					)}
					flyoutTitle={text.sheetTitle.minerals}
					showLabel={text.apply(shown.length, text.nouns.minerals)}
				/>
			</Card>
			{shown.length === 0 ? (
				<EmptyState
					title={text.empty.title(text.nouns.minerals)}
					description={text.empty.description}
					actions={
						isFilteringMinerals(filters) ? (
							<Button onClick={clearFilters}>{text.empty.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className={BLOCK_GRID}>
					{shown.map((mineral) => (
						<Card
							key={mineral.id}
							highlighted={statusOf(mineral) === "donated"}
							className={`flex flex-col gap-2.5 p-3 ${statusOf(mineral) === "donated" ? "bg-tint" : ""}`}
						>
							<div className="flex items-start gap-3">
								<img
									src={assetPath(mineral.image)}
									alt=""
									className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
								/>
								<span className="min-w-0 flex-1 font-semibold">{mineral.name}</span>
							</div>
							<MuseumStatusControl
								name={mineral.name}
								status={statusOf(mineral)}
								onChange={(status) => onStatusChange(mineral, status)}
							/>
							<GeodeChips names={geodesHolding(mineral)} />
							<QualityPrices
								price={mineral.sellPrice}
								maxQuality="base"
								bonus={bonusFor(mineral)}
							/>
							<DetailsButton
								label={text.card.details(mineral.name)}
								text={text.card.locationsAndSources}
								onClick={() => setSelected(mineral)}
							/>
						</Card>
					))}
				</div>
			)}
			<ItemDialog
				open={selected !== null}
				onClose={() => setSelected(null)}
				closeLabel={text.dialog.close}
				title={selected?.name ?? ""}
				image={selected?.image ?? ""}
				kind={text.dialog.type.mineral}
			>
				{selected && (
					<>
						<DialogSection title={text.dialog.status}>
							<MuseumStatusControl
								name={selected.name}
								status={statusOf(selected)}
								onChange={(status) => onStatusChange(selected, status)}
							/>
							<p className="text-muted text-xs">
								{collectionsText.museum.donatedIncludesFound}
							</p>
						</DialogSection>
						<p className="text-muted italic">{selected.description}</p>
						<DialogSection title={text.dialog.sellPrice}>
							<QualityPrices
								price={selected.sellPrice}
								maxQuality="base"
								bonus={bonusFor(selected)}
							/>
						</DialogSection>
						{geodesHolding(selected).length > 0 && (
							<DialogSection title={text.dialog.foundIn}>
								<GeodeChips names={geodesHolding(selected)} />
								<p className="text-muted text-xs">{text.dialog.foundInNote}</p>
							</DialogSection>
						)}
						<DialogSection title={text.dialog.howToFind}>
							<TextList items={selected.locations} />
						</DialogSection>
					</>
				)}
			</ItemDialog>
		</CollectionBlock>
	);
}
