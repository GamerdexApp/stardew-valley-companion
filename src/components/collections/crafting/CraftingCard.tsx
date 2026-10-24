import type { CraftingRecipe } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import { isInCraftingCollection } from "@/service/crafting";
import type { RecipeStatus } from "@/service/recipes";
import { Card } from "@/comps/ui/Card";
import { RecipeStatusControl } from "../shared/RecipeStatusControl";

const text = collectionsText.crafting;

const chip = "border-line text-muted rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium";

interface CraftingCardProps {
	recipe: CraftingRecipe;
	status: RecipeStatus;
	onStatusChange: (status: RecipeStatus) => void;
	onOpen: () => void;
}

export function CraftingCard({ recipe, status, onStatusChange, onOpen }: CraftingCardProps) {
	return (
		<Card
			highlighted={status === "done"}
			className={`flex flex-col gap-2.5 p-3 ${status === "done" ? "bg-tint" : ""}`}
		>
			<div className="flex items-start gap-3">
				<img
					loading="lazy"
					decoding="async"
					src={assetPath(recipe.image)}
					alt=""
					className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<span className="font-semibold">{recipe.name}</span>
						{recipe.output.quantity > 1 && (
							<span className={`${chip} text-changed`}>
								{text.card.makes(recipe.output.quantity)}
							</span>
						)}
					</span>
					<span className="text-muted text-xs">{recipe.source}</span>
				</div>
			</div>
			<RecipeStatusControl
				kind="crafting"
				name={recipe.name}
				status={status}
				onChange={onStatusChange}
			/>
			<ul className="flex flex-wrap gap-1">
				{recipe.ingredients.map((ingredient) => (
					<li key={ingredient.id} className={chip}>
						{text.card.ingredient(ingredient.quantity, ingredient.name)}
					</li>
				))}
			</ul>
			{!isInCraftingCollection(recipe) && (
				<p className="text-muted text-xs">{text.card.notInCollection}</p>
			)}
			<button
				type="button"
				onClick={onOpen}
				aria-label={text.card.details(recipe.name)}
				className="text-link flex min-h-11 items-center self-start font-semibold underline-offset-2 hover:underline lg:min-h-6"
			>
				{text.card.recipeDetails}
			</button>
		</Card>
	);
}
