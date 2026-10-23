"use client";

import type { ArtisanGood } from "stardew-valley-data";
import { useMemo, useState } from "react";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import type { BonusResult } from "@/lib/utils/professionPrices";
import { calculateGood, ingredientOptions } from "@/service/artisanGoods";
import type { IngredientOption } from "@/service/artisanGoods";
import { Input } from "@/comps/ui/Input";
import { EnergyHealthGrid } from "../shared/EnergyHealthGrid";
import { DialogSection, ItemDialog } from "../shared/ItemDialog";
import { QualityPrices } from "../shared/QualityPrices";

const text = collectionsText.artisanGoods.calculator;

interface CalculatorBodyProps {
	good: ArtisanGood;
	professionsOn: boolean;
	bonusesFor: (price: number) => BonusResult[];
}

/** The state lives here, so a new calculation starts empty each time the dialog opens. */
function CalculatorBody({ good, professionsOn, bonusesFor }: CalculatorBodyProps) {
	const [query, setQuery] = useState("");
	const [selected, setSelected] = useState<IngredientOption | null>(null);
	const options = useMemo(() => ingredientOptions(good), [good]);
	const shown = options.filter((option) =>
		option.name.toLowerCase().includes(query.trim().toLowerCase())
	);
	const result = selected ? calculateGood(good, selected) : null;
	const energy = result?.energy ?? 0;
	const health = result?.health ?? 0;
	const searchLabel = text.search(good.ingredients[0]?.name ?? "ingredients");

	return (
		<>
			<DialogSection title={text.pick}>
				<Input
					type="search"
					aria-label={searchLabel}
					placeholder={searchLabel}
					value={query}
					onChange={(event) => setQuery(event.target.value)}
				/>
				<p className="text-muted text-xs">{text.shown(shown.length, options.length)}</p>
				{shown.length === 0 ? (
					<p className="text-muted py-4 text-center">{text.noMatch}</p>
				) : (
					<ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
						{shown.map((option) => {
							const isSelected = selected?.name === option.name;
							return (
								<li key={option.name}>
									<button
										type="button"
										aria-pressed={isSelected}
										onClick={() => setSelected(option)}
										className={`flex min-h-11 w-full items-center gap-2 rounded-md border-[1.5px] px-2 py-1.5 text-start ${
											isSelected
												? "border-primary bg-tint"
												: "border-line bg-surface hover:bg-tint"
										}`}
									>
										<img
											src={assetPath(option.image)}
											alt=""
											className="size-8 shrink-0 object-contain [image-rendering:pixelated]"
										/>
										<span className="flex min-w-0 flex-col">
											<span className="truncate text-xs font-medium">
												{option.name}
											</span>
											<span className="text-muted font-mono text-xs">
												{option.sublabel ??
													text.ingredientPrice(option.basePrice)}
											</span>
										</span>
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</DialogSection>
			<DialogSection title={text.result}>
				{selected && result ? (
					<>
						<p className="font-medium">{text.becomes(selected.name, good.name)}</p>
						<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
							{text.sellPrice}
						</span>
						<QualityPrices
							price={result.sellPrice}
							maxQuality={good.maxQuality}
							bonuses={bonusesFor(result.sellPrice)}
						/>
						{(energy > 0 || health > 0) && (
							<>
								<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
									{text.energyHealth}
								</span>
								<EnergyHealthGrid
									energy={energy}
									health={health}
									maxQuality={good.maxQuality}
								/>
							</>
						)}
					</>
				) : (
					<p className="text-muted">{text.noResult}</p>
				)}
				<p className="text-muted text-xs">
					{professionsOn ? text.professionsOn : text.professionsOff}
				</p>
			</DialogSection>
		</>
	);
}

interface PriceCalculatorDialogProps {
	good: ArtisanGood | null;
	professionsOn: boolean;
	bonusesFor: (good: ArtisanGood, price: number) => BonusResult[];
	onClose: () => void;
}

export function PriceCalculatorDialog({
	good,
	professionsOn,
	bonusesFor,
	onClose,
}: PriceCalculatorDialogProps) {
	return (
		<ItemDialog
			open={good !== null}
			onClose={onClose}
			closeLabel={text.close}
			title={good ? text.title(good.name) : ""}
			image={good?.image ?? ""}
			kind={good?.sellPriceFormula ?? ""}
		>
			{good && (
				<CalculatorBody
					good={good}
					professionsOn={professionsOn}
					bonusesFor={(price) => bonusesFor(good, price)}
				/>
			)}
		</ItemDialog>
	);
}
