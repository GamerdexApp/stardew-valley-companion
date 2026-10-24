import type { Crop } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import type { BonusResult } from "@/lib/utils/professionPrices";
import { harvestLabel, isShippableCrop } from "@/service/crops";
import { Card } from "@/comps/ui/Card";
import { ExpandableDetails } from "@/comps/ui/ExpandableDetails";
import { ArtisanUsesChips } from "../shared/ArtisanUsesChips";
import { EnergyHealthGrid } from "../shared/EnergyHealthGrid";
import { QualityPrices } from "../shared/QualityPrices";
import { SeasonChips } from "../shared/SeasonChips";
import { SeedRow } from "../shared/SeedRow";
import { ShippedCorner } from "../shared/ShippedControl";

const text = collectionsText.crops.card;

const chip = "border-line rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium";

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<span className="flex items-baseline gap-1.5">
			<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
				{label}
			</span>
			<span className="font-mono text-xs font-medium">{value}</span>
		</span>
	);
}

interface CropCardProps {
	crop: Crop;
	shipped: boolean;
	count: number;
	bonus: BonusResult | null;
	onShippedChange: (shipped: boolean) => void;
	onCountChange: (count: number) => void;
}

export function CropCard({
	crop,
	shipped,
	count,
	bonus,
	onShippedChange,
	onCountChange,
}: CropCardProps) {
	const harvest = harvestLabel(crop);
	const energy = crop.energyHealth?.energy ?? 0;
	const health = crop.energyHealth?.health ?? 0;
	const hasEnergyHealth = !crop.energyHealth?.poison && (energy > 0 || health > 0);

	return (
		<Card
			highlighted={shipped}
			className={`flex flex-col gap-2.5 p-3 ${shipped ? "bg-tint" : ""}`}
		>
			<div className="flex items-start gap-3">
				<img
					loading="lazy"
					decoding="async"
					src={assetPath(crop.image)}
					alt=""
					className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="font-semibold">{crop.name}</span>
					<div className="flex flex-wrap gap-1">
						<SeasonChips seasons={crop.seasons} />
						{crop.giant && <span className={`${chip} text-fixed`}>{text.giant}</span>}
						{crop.trellis && (
							<span className={`${chip} text-warn`}>{text.trellis}</span>
						)}
					</div>
				</div>
				{isShippableCrop(crop) && (
					<ShippedCorner
						name={crop.name}
						shipped={shipped}
						count={count}
						onShippedChange={onShippedChange}
						onCountChange={onCountChange}
					/>
				)}
			</div>
			{!isShippableCrop(crop) && <p className="text-muted text-xs">{text.notShippable}</p>}
			<SeedRow image={crop.seedImage} name={crop.seedName} prices={crop.seedBuyPrices} />
			<div className="border-line flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border-[1.5px] px-2.5 py-1.5">
				<Stat label={text.grow} value={text.days(crop.growDays)} />
				{crop.regrowDays !== null && (
					<Stat label={text.regrow} value={text.days(crop.regrowDays)} />
				)}
				{harvest && <Stat label={text.harvest} value={harvest} />}
			</div>
			<QualityPrices price={crop.cropSellPrice} maxQuality={crop.maxQuality} bonus={bonus} />
			{hasEnergyHealth && (
				<EnergyHealthGrid energy={energy} health={health} maxQuality={crop.maxQuality} />
			)}
			<ArtisanUsesChips uses={crop.artisanUses} />
			<ExpandableDetails showLabel={text.showDetails} hideLabel={text.hideDetails}>
				<p className="text-sm">
					<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
						{text.farmingXp}
					</span>{" "}
					<span className="font-mono font-medium">{crop.farmingXP}</span>
				</p>
				<div className="flex flex-col gap-1.5">
					<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
						{text.growthStages}
					</span>
					<ol className="flex flex-wrap items-center gap-1">
						{crop.stages.map((stage, index) => (
							<li key={`${stage.name}-${index}`} className="flex items-center gap-1">
								{index > 0 && (
									<span aria-hidden="true" className="text-muted">
										›
									</span>
								)}
								<img
									loading="lazy"
									decoding="async"
									src={assetPath(stage.image)}
									alt={text.stage(stage.name)}
									className="size-8 object-contain [image-rendering:pixelated]"
								/>
							</li>
						))}
					</ol>
				</div>
			</ExpandableDetails>
		</Card>
	);
}
