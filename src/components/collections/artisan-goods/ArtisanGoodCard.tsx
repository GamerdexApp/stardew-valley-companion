import type { ArtisanGood } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import type { BonusResult } from "@/lib/utils/professionPrices";
import { hasFixedPrice, isShippableGood } from "@/service/artisanGoods";
import { EQUIPMENT_IMAGES, INGREDIENT_IMAGE_MAP } from "@/data/constants/artisanGoods";
import { Card } from "@/comps/ui/Card";
import { EnergyHealthGrid } from "../shared/EnergyHealthGrid";
import { QualityPrices } from "../shared/QualityPrices";
import { ShippedCorner } from "../shared/ShippedControl";

const text = collectionsText.artisanGoods.card;

const chip =
	"border-line text-muted flex items-center gap-1.5 rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium";

interface ArtisanGoodCardProps {
	good: ArtisanGood;
	shipped: boolean;
	count: number;
	bonuses: BonusResult[];
	onShippedChange: (shipped: boolean) => void;
	onCountChange: (count: number) => void;
	onCalculate: () => void;
}

export function ArtisanGoodCard({
	good,
	shipped,
	count,
	bonuses,
	onShippedChange,
	onCountChange,
	onCalculate,
}: ArtisanGoodCardProps) {
	const equipmentImage = EQUIPMENT_IMAGES[good.equipment];
	const energy = good.energyHealth?.energy ?? 0;
	const health = good.energyHealth?.health ?? 0;
	const isPoison = good.energyHealth?.poison === true;

	return (
		<Card
			highlighted={shipped}
			className={`flex flex-col gap-2.5 p-3 ${shipped ? "bg-tint" : ""}`}
		>
			<div className="flex items-start gap-3">
				<img
					src={assetPath(good.image)}
					alt=""
					className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-1.5">
					<span className="font-semibold">{good.name}</span>
					<span className="text-muted flex items-center gap-1.5 text-xs">
						{equipmentImage && (
							<img
								src={assetPath(equipmentImage)}
								alt=""
								className="size-5 object-contain [image-rendering:pixelated]"
							/>
						)}
						{good.equipment}
					</span>
					{good.ingredients.length > 0 && (
						<ul className="flex flex-wrap gap-1">
							{good.ingredients.map((ingredient) => {
								const image = ingredient.id
									? INGREDIENT_IMAGE_MAP[ingredient.id]
									: undefined;
								return (
									<li key={ingredient.name} className={chip}>
										{image && (
											<img
												src={assetPath(image)}
												alt=""
												className="size-4 object-contain [image-rendering:pixelated]"
											/>
										)}
										{ingredient.name}
									</li>
								);
							})}
						</ul>
					)}
				</div>
				{isShippableGood(good) && (
					<ShippedCorner
						name={good.name}
						shipped={shipped}
						count={count}
						onShippedChange={onShippedChange}
						onCountChange={onCountChange}
					/>
				)}
			</div>
			{!isShippableGood(good) && <p className="text-muted text-xs">{text.notShippable}</p>}
			{hasFixedPrice(good) ? (
				<QualityPrices
					price={good.sellPrice!}
					maxQuality={good.maxQuality}
					bonuses={bonuses}
				/>
			) : (
				<div className="border-line flex flex-col gap-1.5 rounded-md border-[1.5px] px-2.5 py-2">
					<span className="text-muted text-xs italic">{good.sellPriceFormula}</span>
					<button
						type="button"
						onClick={onCalculate}
						aria-label={text.calculateLabel(good.name)}
						className="text-link flex min-h-11 items-center self-start font-semibold underline-offset-2 hover:underline lg:min-h-6"
					>
						{text.calculate}
					</button>
				</div>
			)}
			{isPoison && <p className="text-warn text-xs font-medium">{text.poison}</p>}
			{!isPoison && (energy > 0 || health > 0) && (
				<EnergyHealthGrid energy={energy} health={health} maxQuality={good.maxQuality} />
			)}
			{good.buffs.length > 0 && (
				<ul className="flex flex-wrap gap-1">
					{good.buffs.map((buff) => (
						<li
							key={buff.stat}
							className={`${chip} ${buff.value > 0 ? "text-kept" : "text-warn"}`}
						>
							{text.buff(buff.stat, buff.value)}
							{good.buffDuration !== null &&
								` · ${text.buffDuration(good.buffDuration)}`}
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}
