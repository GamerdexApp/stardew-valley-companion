"use client";

import { useMemo, useState } from "react";
import type { GameData } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import type { BonusResult } from "@/lib/utils/professionPrices";
import {
	countShipped,
	emptyShippedFilters,
	filterShippable,
	isFilteringShipped,
	mineralNameById,
} from "@/service/minerals";
import type { ShippableItem, ShippedFilters } from "@/service/minerals";
import { isShipped, shippedCount } from "@/service/shipped";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { BLOCK_GRID, CollectionBlock, DetailsButton } from "../shared/CollectionBlock";
import { DialogSection, ItemDialog, TextList } from "../shared/ItemDialog";
import { QualityPrices } from "../shared/QualityPrices";
import { ShippedControl, ShippedCorner } from "../shared/ShippedControl";

const text = collectionsText.minerals;
const options = text.options;

const fields: FilterFieldConfig[] = [
	{
		id: "shipped",
		label: text.filter.shipped,
		options: [
			{ id: "all", label: options.all },
			{ id: "shipped", label: options.shipped },
			{ id: "not-shipped", label: options.notShipped },
		],
	},
];

export type ShippableBlock = "ores" | "bars" | "resources";

const KIND_TEXT = { ores: "ore", bars: "bar", resources: "resource" } as const;

interface ShippableSectionProps {
	block: ShippableBlock;
	items: ShippableItem[];
	data: GameData;
	bonusFor: (item: ShippableItem) => BonusResult | null;
	onShippedChange: (item: ShippableItem, shipped: boolean) => void;
	onCountChange: (item: ShippableItem, count: number) => void;
}

const isBar = (item: ShippableItem): item is Extract<ShippableItem, { kind: "bar" }> =>
	item.kind === "bar";

const smeltLine = (recipe: {
	ore: string;
	oreQty: number;
	coalQty: number;
	timeMinutes: number;
	outputQty?: number;
}) =>
	text.dialog.smeltLine(
		recipe.oreQty,
		mineralNameById(recipe.ore),
		recipe.coalQty,
		recipe.timeMinutes,
		recipe.outputQty
	);

/** Ores, bars and resources share a card: a Shipped switch with a count, and the price. */
export function ShippableSection({
	block,
	items,
	data,
	bonusFor,
	onShippedChange,
	onCountChange,
}: ShippableSectionProps) {
	const [filters, setFilters] = useMemoryState<ShippedFilters>(
		`collections:minerals:${block}`,
		emptyShippedFilters
	);
	const [selected, setSelected] = useState<ShippableItem | null>(null);

	const shown = useMemo(() => filterShippable(items, data, filters), [items, data, filters]);
	const clearFilters = () => setFilters(emptyShippedFilters);
	const noun = text.nouns[block];

	const control = (item: ShippableItem) => (
		<ShippedControl
			name={item.name}
			shipped={isShipped(data, item.id)}
			count={shippedCount(data, item.id)}
			onShippedChange={(shipped) => onShippedChange(item, shipped)}
			onCountChange={(count) => onCountChange(item, count)}
		/>
	);

	const corner = (item: ShippableItem) => (
		<ShippedCorner
			name={item.name}
			shipped={isShipped(data, item.id)}
			count={shippedCount(data, item.id)}
			onShippedChange={(shipped) => onShippedChange(item, shipped)}
			onCountChange={(count) => onCountChange(item, count)}
		/>
	);

	return (
		<CollectionBlock
			id={`minerals-${block}`}
			title={text.blocks[block]}
			badge={text.badge.shipped(countShipped(data, items), items.length)}
		>
			<Card className="p-4">
				<FilterBlock
					fields={fields}
					values={{ ...filters }}
					onChange={(fieldId, value) => setFilters({ ...filters, [fieldId]: value })}
					onClear={clearFilters}
					search={{
						label: text.search[block],
						value: filters.query,
						onChange: (query) => setFilters({ ...filters, query }),
					}}
					summary={collectionsText.filters.showing(shown.length, items.length, noun)}
					flyoutTitle={text.sheetTitle[block]}
					showLabel={text.apply(shown.length, noun)}
				/>
			</Card>
			{shown.length === 0 ? (
				<EmptyState
					title={text.empty.title(noun)}
					description={text.empty.description}
					actions={
						isFilteringShipped(filters) ? (
							<Button onClick={clearFilters}>{text.empty.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className={BLOCK_GRID}>
					{shown.map((item) => (
						<Card
							key={item.id}
							highlighted={isShipped(data, item.id)}
							className={`flex flex-col gap-2.5 p-3 ${isShipped(data, item.id) ? "bg-tint" : ""}`}
						>
							<div className="flex items-start gap-3">
								<img
									loading="lazy"
									decoding="async"
									src={assetPath(item.image)}
									alt=""
									className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
								/>
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<span className="font-semibold">{item.name}</span>
									{isBar(item) && item.smeltRecipes[0] && (
										<span className="text-muted text-xs">
											{smeltLine(item.smeltRecipes[0])}
										</span>
									)}
								</div>
								{corner(item)}
							</div>
							<QualityPrices
								price={item.sellPrice}
								maxQuality="base"
								bonus={bonusFor(item)}
							/>
							<DetailsButton
								name={item.name}
								text={
									isBar(item)
										? text.card.smeltRecipeAndLocations
										: text.card.locations
								}
								onClick={() => setSelected(item)}
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
				kind={text.dialog.type[KIND_TEXT[block]]}
			>
				{selected && (
					<>
						<DialogSection title={text.dialog.shipped}>
							{control(selected)}
						</DialogSection>
						<p className="text-muted italic">{selected.description}</p>
						<DialogSection title={text.dialog.sellPrice}>
							<QualityPrices
								price={selected.sellPrice}
								maxQuality="base"
								bonus={bonusFor(selected)}
							/>
						</DialogSection>
						{isBar(selected) && selected.smeltRecipes.length > 0 && (
							<DialogSection title={text.dialog.smelt}>
								<TextList items={selected.smeltRecipes.map(smeltLine)} />
							</DialogSection>
						)}
						{!isBar(selected) && selected.locations.length > 0 && (
							<DialogSection title={text.dialog.howToFind}>
								<TextList items={selected.locations} />
							</DialogSection>
						)}
					</>
				)}
			</ItemDialog>
		</CollectionBlock>
	);
}
