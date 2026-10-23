import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import type { BonusResult } from "@/lib/utils/professionPrices";
import { isShippableItem } from "@/service/forageables";
import type { ForageItem } from "@/service/forageables";
import { Card } from "@/comps/ui/Card";
import { ArtisanUsesChips } from "../shared/ArtisanUsesChips";
import { EnergyHealthGrid } from "../shared/EnergyHealthGrid";
import { QualityPrices } from "../shared/QualityPrices";
import { SeasonChips } from "../shared/SeasonChips";
import { ShippedControl } from "../shared/ShippedControl";

const text = collectionsText.forageables;

interface ForageItemCardProps {
	item: ForageItem;
	shipped: boolean;
	count: number;
	bonus: BonusResult | null;
	onShippedChange: (shipped: boolean) => void;
	onCountChange: (count: number) => void;
}

export function ForageItemCard({
	item,
	shipped,
	count,
	bonus,
	onShippedChange,
	onCountChange,
}: ForageItemCardProps) {
	const energy = item.energyHealth?.energy ?? 0;
	const health = item.energyHealth?.health ?? 0;
	const hasEnergyHealth = !item.energyHealth?.poison && (energy > 0 || health > 0);

	return (
		<Card
			highlighted={shipped}
			className={`flex flex-col gap-2.5 p-3 ${shipped ? "bg-tint" : ""}`}
		>
			<div className="flex items-start gap-3">
				<img
					src={assetPath(item.image)}
					alt=""
					className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="font-semibold">{item.name}</span>
					<div className="flex flex-wrap items-center gap-1">
						<SeasonChips seasons={item.seasons} />
						<span className="text-muted text-xs">{text.kind[item.kind]}</span>
					</div>
				</div>
			</div>
			<p className="text-muted text-xs italic">{text.card.place(item.kind, item.place)}</p>
			{isShippableItem(item.id) ? (
				<ShippedControl
					name={item.name}
					shipped={shipped}
					count={count}
					onShippedChange={onShippedChange}
					onCountChange={onCountChange}
				/>
			) : (
				<p className="text-muted text-xs">{text.card.notShippable}</p>
			)}
			<QualityPrices price={item.sellPrice} maxQuality={item.maxQuality} bonus={bonus} />
			{hasEnergyHealth && (
				<EnergyHealthGrid energy={energy} health={health} maxQuality={item.maxQuality} />
			)}
			{item.artisanUses && <ArtisanUsesChips uses={item.artisanUses} />}
		</Card>
	);
}
