import type { CookedDish } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import { energyAndHealth } from "@/service/cooking";
import type { RecipeStatus } from "@/service/recipes";
import { Card } from "@/comps/ui/Card";
import { RecipeStatusControl } from "../shared/RecipeStatusControl";
import { shortSource } from "./sourceText";

const text = collectionsText.cooking;

export const chip =
	"border-line text-muted rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium";

interface CookingCardProps {
	dish: CookedDish;
	status: RecipeStatus;
	onStatusChange: (status: RecipeStatus) => void;
	onOpen: () => void;
}

export function CookingCard({ dish, status, onStatusChange, onOpen }: CookingCardProps) {
	const { energy, health } = energyAndHealth(dish);

	return (
		<Card
			highlighted={status === "done"}
			className={`flex flex-col gap-2.5 p-3 ${status === "done" ? "bg-tint" : ""}`}
		>
			<div className="flex items-start gap-3">
				<img
					src={assetPath(dish.image)}
					alt=""
					className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="font-semibold">{dish.name}</span>
					<span className="text-muted text-xs">{shortSource(dish.recipeSources[0])}</span>
				</div>
			</div>
			<RecipeStatusControl
				kind="cooking"
				name={dish.name}
				status={status}
				onChange={onStatusChange}
			/>
			<ul className="flex flex-wrap gap-1">
				{energy > 0 && (
					<li className={chip}>
						{text.card.energy} +{energy}
					</li>
				)}
				{health > 0 && (
					<li className={chip}>
						{text.card.health} +{health}
					</li>
				)}
				{dish.buffs.map((buff) => (
					<li key={buff.stat} className={`${chip} text-added`}>
						{text.card.buff(buff.stat, buff.value)}
					</li>
				))}
			</ul>
			<button
				type="button"
				onClick={onOpen}
				aria-label={text.card.details(dish.name)}
				className="text-link flex min-h-11 items-center self-start font-semibold underline-offset-2 hover:underline lg:min-h-6"
			>
				{text.card.ingredientsAndSources}
			</button>
		</Card>
	);
}
