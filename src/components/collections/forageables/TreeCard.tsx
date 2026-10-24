import type { Tree } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import type { BonusResult } from "@/lib/utils/professionPrices";
import { treeProduce } from "@/service/forageables";
import { Card } from "@/comps/ui/Card";
import { ExpandableDetails } from "@/comps/ui/ExpandableDetails";
import { ArtisanUsesChips } from "../shared/ArtisanUsesChips";
import { EnergyHealthGrid } from "../shared/EnergyHealthGrid";
import { QualityPrices } from "../shared/QualityPrices";
import { SeasonChips } from "../shared/SeasonChips";
import { SeedRow } from "../shared/SeedRow";

const text = collectionsText.forageables.trees;

const chip = "border-line text-muted rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium";

interface TreeCardProps {
	tree: Tree;
	/** How many of what the tree gives are shipped. Zero means not shipped. */
	shippedCount: number;
	bonus: BonusResult | null;
}

export function TreeCard({ tree, shippedCount, bonus }: TreeCardProps) {
	const produce = treeProduce(tree);
	const fruit = tree.type === "fruit-tree" ? tree : null;
	const seed =
		tree.type === "fruit-tree"
			? { image: tree.saplingImage, name: tree.saplingName, prices: tree.saplingBuyPrices }
			: tree.seedImage && tree.seedName
				? { image: tree.seedImage, name: tree.seedName, prices: [] }
				: null;
	const chopped = tree.choppedProduce.map((item) => item.name);
	const energy = produce?.energyHealth?.energy ?? 0;
	const health = produce?.energyHealth?.health ?? 0;

	return (
		<Card className="flex flex-col gap-2.5 p-3">
			<div className="flex items-start gap-3">
				<img
					loading="lazy"
					decoding="async"
					src={assetPath(tree.image)}
					alt=""
					className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="font-semibold">{tree.name}</span>
					<div className="flex flex-wrap items-center gap-1">
						{fruit ? (
							<>
								<SeasonChips seasons={fruit.seasons} />
								<span className={chip}>{text.mature(fruit.daysToMature)}</span>
							</>
						) : (
							<span className="text-muted text-xs">{text.wildYearRound}</span>
						)}
					</div>
				</div>
			</div>
			{seed && <SeedRow image={seed.image} name={seed.name} prices={seed.prices} />}
			<div className="bg-bg flex flex-col gap-1 rounded-md px-3 py-2">
				<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
					{fruit ? text.produce : text.tapperProduce}
				</span>
				{produce ? (
					<>
						<span className="font-medium">{produce.name}</span>
						<span className="flex items-center justify-between gap-3 text-xs">
							<span className="font-mono">{produce.sellPrice.toLocaleString()}g</span>
							<span
								className={
									shippedCount > 0 ? "text-kept font-medium" : "text-muted"
								}
							>
								{shippedCount > 0
									? text.shippedTimes(shippedCount)
									: text.notShipped}
							</span>
						</span>
					</>
				) : (
					<span className="text-muted text-sm">{text.noProduce}</span>
				)}
			</div>
			{!fruit && chopped.length > 0 && (
				<div className="flex flex-col gap-1">
					<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
						{text.chopped}
					</span>
					<ul className="flex flex-wrap gap-1">
						{chopped.map((name) => (
							<li key={name} className={chip}>
								{name}
							</li>
						))}
					</ul>
				</div>
			)}
			<ExpandableDetails showLabel={text.showDetails} hideLabel={text.hideDetails}>
				<div className="flex flex-col gap-1.5">
					<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
						{text.growthStages}
					</span>
					<ol className="flex flex-wrap items-center gap-1">
						{tree.stages.map((stage, index) => (
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
				{produce && (
					<>
						<span className="text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
							{text.sellPrice}
						</span>
						<QualityPrices
							price={produce.sellPrice}
							maxQuality={produce.maxQuality}
							bonus={bonus}
						/>
						{(energy > 0 || health > 0) && !produce.energyHealth?.poison && (
							<EnergyHealthGrid
								energy={energy}
								health={health}
								maxQuality={produce.maxQuality}
							/>
						)}
						{produce.artisanUses && <ArtisanUsesChips uses={produce.artisanUses} />}
					</>
				)}
			</ExpandableDetails>
		</Card>
	);
}
