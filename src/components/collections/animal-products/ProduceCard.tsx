import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import type { BonusResult } from "@/lib/utils/professionPrices";
import { isTrackedProduce } from "@/service/animalProducts";
import type { Produce } from "@/service/animalProducts";
import { Card } from "@/comps/ui/Card";
import { QualityPrices } from "../shared/QualityPrices";
import { ShippedControl } from "../shared/ShippedControl";

const text = collectionsText.animalProducts.card;

interface ProduceCardProps {
	produce: Produce;
	shipped: boolean;
	count: number;
	bonus: BonusResult | null;
	onShippedChange: (shipped: boolean) => void;
	onCountChange: (count: number) => void;
}

export function ProduceCard({
	produce,
	shipped,
	count,
	bonus,
	onShippedChange,
	onCountChange,
}: ProduceCardProps) {
	return (
		<Card
			highlighted={shipped}
			className={`flex flex-col gap-2.5 p-3 ${shipped ? "bg-tint" : ""}`}
		>
			<div className="flex items-start gap-3">
				<img
					src={assetPath(produce.image)}
					alt=""
					className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<span className="font-semibold">{produce.name}</span>
						{produce.isDeluxe && (
							<span className="border-line text-changed rounded-md border-[1.5px] px-1.5 py-0.5 font-mono text-[11px] tracking-[0.06em] uppercase">
								{text.deluxe}
							</span>
						)}
					</span>
					<span className="text-muted text-xs">{text.from(produce.sources)}</span>
				</div>
			</div>
			{isTrackedProduce(produce) ? (
				<ShippedControl
					name={produce.name}
					shipped={shipped}
					count={count}
					onShippedChange={onShippedChange}
					onCountChange={onCountChange}
				/>
			) : (
				<p className="text-muted text-xs">{text.notTracked}</p>
			)}
			<QualityPrices
				price={produce.sellPrice}
				maxQuality={produce.maxQuality}
				bonus={bonus}
			/>
		</Card>
	);
}
