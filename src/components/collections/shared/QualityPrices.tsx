import { QualityCalculator } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";

const calc = new QualityCalculator();
const text = collectionsText.prices;

export type MaxQuality = "iridium" | "gold" | "silver" | "base";

const TIERS_BY_MAX: Record<MaxQuality, number> = { base: 0, silver: 1, gold: 2, iridium: 3 };

export interface PriceBonus {
	price: number;
	label: string;
}

const cell = "flex flex-col items-center gap-0.5 px-1 py-1.5";

function Row({ price, label, reachable }: { price: number; label: string; reachable: number }) {
	const tiers = calc.sellPrices(price).slice(0, reachable);
	return (
		<div
			className="border-line grid overflow-hidden rounded-md border-[1.5px]"
			style={{ gridTemplateColumns: `repeat(${tiers.length + 1}, minmax(0, 1fr))` }}
		>
			<div className={`${cell} bg-bg`}>
				<span className="text-muted font-mono text-[11px] uppercase">{label}</span>
				<span className="font-mono text-xs font-medium">{price.toLocaleString()}g</span>
			</div>
			{tiers.map(({ quality, icon, value }) => (
				<div key={quality} className={`${cell} border-line border-s-[1.5px]`}>
					<img src={assetPath(icon)} alt={quality} className="size-4 object-contain" />
					<span className="font-mono text-xs font-medium">{value.toLocaleString()}g</span>
				</div>
			))}
		</div>
	);
}

interface QualityPricesProps {
	price: number;
	maxQuality: MaxQuality;
	bonus?: PriceBonus | null;
}

/**
 * The sell price at every quality the item can reach. An item that cannot have quality shows one
 * price. A profession bonus adds a second row with the bonus price at each quality.
 */
export function QualityPrices({ price, maxQuality, bonus = null }: QualityPricesProps) {
	const reachable = TIERS_BY_MAX[maxQuality];

	if (reachable === 0) {
		return (
			<div className="flex flex-col gap-1">
				<div className="border-line flex items-center justify-between rounded-md border-[1.5px] px-2.5 py-1.5">
					<span className="text-muted font-mono text-[11px] uppercase">{text.price}</span>
					<span className="font-mono text-xs font-medium">{price.toLocaleString()}g</span>
				</div>
				{bonus && (
					<div className="border-primary flex items-center justify-between rounded-md border-[1.5px] px-2.5 py-1.5">
						<span className="text-primary font-mono text-[11px] uppercase">
							{bonus.label}
						</span>
						<span className="text-primary font-mono text-xs font-medium">
							{bonus.price.toLocaleString()}g
						</span>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1">
			<Row price={price} label={text.basic} reachable={reachable} />
			{bonus && <Row price={bonus.price} label={bonus.label} reachable={reachable} />}
		</div>
	);
}
