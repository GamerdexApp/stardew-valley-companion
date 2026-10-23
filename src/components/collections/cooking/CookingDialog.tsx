"use client";

import type { CookedDish } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";
import { resolveIngredientImage } from "@/lib/pages/crafting";
import { assetPath } from "@/lib/utils/assetPath";
import { buffMinutes, energyAndHealth } from "@/service/cooking";
import type { RecipeStatus } from "@/service/recipes";
import { EnergyHealthGrid } from "../shared/EnergyHealthGrid";
import { DialogSection, ItemDialog, TextList } from "../shared/ItemDialog";
import { QualityPrices } from "../shared/QualityPrices";
import { RecipeStatusControl } from "../shared/RecipeStatusControl";
import { fullSource } from "./sourceText";

const text = collectionsText.cooking;
const copy = text.dialog;

interface CookingDialogProps {
	dish: CookedDish | null;
	status: RecipeStatus;
	onStatusChange: (status: RecipeStatus) => void;
	onClose: () => void;
}

export function CookingDialog({ dish, status, onStatusChange, onClose }: CookingDialogProps) {
	const { energy, health } = dish ? energyAndHealth(dish) : { energy: 0, health: 0 };
	return (
		<ItemDialog
			open={dish !== null}
			onClose={onClose}
			closeLabel={copy.close}
			title={dish?.name ?? ""}
			image={dish?.image ?? ""}
			kind={copy.type}
		>
			{dish && (
				<>
					<DialogSection title={copy.status}>
						<RecipeStatusControl
							kind="cooking"
							name={dish.name}
							status={status}
							onChange={onStatusChange}
						/>
						<p className="text-muted text-xs">
							{collectionsText.recipes.includesLearned.cooking}
						</p>
					</DialogSection>
					<p className="text-muted italic">{dish.description}</p>
					{(energy > 0 || health > 0) && (
						<DialogSection title={copy.energyHealth}>
							<EnergyHealthGrid energy={energy} health={health} maxQuality="base" />
						</DialogSection>
					)}
					<DialogSection title={copy.sellPrice}>
						<QualityPrices price={dish.sellPrice} maxQuality="base" />
					</DialogSection>
					{dish.buffs.length > 0 && (
						<DialogSection title={copy.buffs}>
							<ul className="flex flex-col gap-1.5">
								{dish.buffs.map((buff) => (
									<li
										key={buff.stat}
										className="bg-bg flex items-center justify-between gap-3 rounded-md px-3 py-2"
									>
										<span className="font-medium">{buff.stat}</span>
										<span className="font-mono text-xs">
											{text.card.buffValue(buff.value)}
										</span>
									</li>
								))}
							</ul>
							{dish.buffDuration !== null && (
								<p className="text-muted text-xs">
									{copy.lasts(
										buffMinutes(dish.buffDuration).minutes,
										buffMinutes(dish.buffDuration).seconds
									)}
								</p>
							)}
						</DialogSection>
					)}
					<DialogSection title={copy.sources}>
						<TextList items={dish.recipeSources.map(fullSource)} />
					</DialogSection>
					<DialogSection title={copy.ingredients}>
						<ul className="flex flex-col gap-1.5">
							{dish.ingredients.map((ingredient) => {
								const image = resolveIngredientImage(
									ingredient.id,
									ingredient.name
								);
								return (
									<li
										key={ingredient.id}
										className="bg-bg flex items-center gap-2.5 rounded-md px-3 py-2"
									>
										{image ? (
											<img
												src={image}
												alt=""
												className="size-7 shrink-0 object-contain [image-rendering:pixelated]"
											/>
										) : (
											<span aria-hidden="true" className="size-7 shrink-0" />
										)}
										<span className="flex-1 font-medium">
											{ingredient.name}
										</span>
										<span className="text-muted font-mono text-xs">
											{copy.ingredient(ingredient.quantity)}
										</span>
									</li>
								);
							})}
						</ul>
					</DialogSection>
				</>
			)}
		</ItemDialog>
	);
}
