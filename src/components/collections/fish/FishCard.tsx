import type { Fish } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import { isInFishCollection } from "@/lib/utils/collectionCounts";
import type { BonusResult } from "@/lib/utils/professionPrices";
import { Card } from "@/comps/ui/Card";
import { Switch } from "@/comps/ui/Switch";
import { QualityPrices } from "../shared/QualityPrices";
import { SeasonChips } from "../shared/SeasonChips";
import { DifficultyBar } from "./DifficultyBar";

const text = collectionsText.fish;

const chip = "border-line rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium";

interface FishCardProps {
	fish: Fish;
	caught: boolean;
	bonus: BonusResult | null;
	onCaughtChange: (caught: boolean) => void;
	onOpen: () => void;
}

export function FishCard({ fish, caught, bonus, onCaughtChange, onOpen }: FishCardProps) {
	const isRod = fish.catchType === "rod";

	return (
		<Card
			highlighted={caught}
			className={`flex flex-col gap-2.5 p-3 ${caught ? "bg-tint" : ""}`}
		>
			<div className="flex items-start gap-3">
				<img
					loading="lazy"
					decoding="async"
					src={assetPath(fish.image)}
					alt=""
					className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<button
						type="button"
						onClick={onOpen}
						aria-label={text.card.details(fish.name)}
						className="inline-flex min-h-11 items-center text-start font-semibold underline-offset-2 hover:underline lg:min-h-0"
					>
						{fish.name}
					</button>
					<div className="flex flex-wrap gap-1">
						{fish.seasons.length === 0 ? (
							<span className={`${chip} text-muted`}>{text.card.allSeasons}</span>
						) : (
							<SeasonChips seasons={fish.seasons} />
						)}
					</div>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-0.5">
					<Switch
						checked={caught}
						onChange={onCaughtChange}
						label={text.card.switchLabel(fish.name)}
					/>
					<span className={`text-xs font-medium ${caught ? "text-kept" : "text-muted"}`}>
						{caught ? text.card.caught : text.card.notCaught}
					</span>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-1.5">
				<span className={`${chip} ${isRod ? "text-warn" : "text-added"}`}>
					{isRod ? text.card.rod : text.card.crabPot}
				</span>
				<span className="text-muted text-xs">{fish.location}</span>
				{isRod && fish.weather && (
					<span className={`${chip} text-muted`}>
						{text.weather[fish.weather as keyof typeof text.weather] ?? fish.weather}
					</span>
				)}
				{isRod && fish.time && <span className={`${chip} text-muted`}>{fish.time}</span>}
			</div>
			{!isInFishCollection(fish.id) && (
				<p className="text-muted text-xs">{text.card.notInCollection}</p>
			)}
			{isRod && fish.difficulty != null && (
				<DifficultyBar
					value={fish.difficulty}
					ariaLabel={text.card.difficultyOf(fish.name)}
				/>
			)}
			<QualityPrices price={fish.sellPrice} maxQuality={fish.maxQuality} bonus={bonus} />
		</Card>
	);
}
