"use client";

import type { CraftingRecipe } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";
import { resolveIngredientImage } from "@/lib/pages/crafting";
import type { RecipeStatus } from "@/service/recipes";
import { DialogSection, ItemDialog } from "../shared/ItemDialog";
import { RecipeStatusControl } from "../shared/RecipeStatusControl";

const copy = collectionsText.crafting.dialog;

interface CraftingDialogProps {
	recipe: CraftingRecipe | null;
	status: RecipeStatus;
	onStatusChange: (status: RecipeStatus) => void;
	onClose: () => void;
}

export function CraftingDialog({ recipe, status, onStatusChange, onClose }: CraftingDialogProps) {
	return (
		<ItemDialog
			open={recipe !== null}
			onClose={onClose}
			closeLabel={copy.close}
			title={recipe?.name ?? ""}
			image={recipe?.image ?? ""}
			kind={recipe?.category ?? ""}
		>
			{recipe && (
				<>
					<DialogSection title={copy.status}>
						<RecipeStatusControl
							kind="crafting"
							name={recipe.name}
							status={status}
							onChange={onStatusChange}
						/>
						<p className="text-muted text-xs">
							{collectionsText.recipes.includesLearned.crafting}
						</p>
					</DialogSection>
					<p className="text-muted italic">{recipe.description}</p>
					<div className="grid grid-cols-2 gap-2">
						<div className="bg-bg flex flex-col gap-1 rounded-md px-3 py-2.5">
							<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
								{copy.source}
							</span>
							<span className="font-medium">{recipe.source}</span>
						</div>
						<div className="bg-bg flex flex-col gap-1 rounded-md px-3 py-2.5">
							<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
								{copy.output}
							</span>
							<span className="font-medium">
								{copy.outputLine(recipe.output.name, recipe.output.quantity)}
							</span>
							{recipe.output.isBigCraftable && (
								<span className="text-muted text-xs">{copy.bigCraftable}</span>
							)}
						</div>
					</div>
					<DialogSection title={copy.ingredients}>
						<ul className="flex flex-col gap-1.5">
							{recipe.ingredients.map((ingredient) => {
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
