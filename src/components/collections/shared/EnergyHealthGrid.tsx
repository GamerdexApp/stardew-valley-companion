import { QualityCalculator } from "stardew-valley-data";
import { assetPath } from "@/lib/utils/assetPath";
import type { MaxQuality } from "./QualityPrices";

const calc = new QualityCalculator();

function Pair({
	energy,
	health,
	stacked = false,
}: {
	energy: number;
	health: number;
	stacked?: boolean;
}) {
	return (
		<span className={`flex ${stacked ? "flex-col items-start gap-0.5" : "items-center gap-2"}`}>
			<span className="flex items-center gap-0.5">
				<img
					src={assetPath("images/misc/Energy.png")}
					alt="Energy"
					className="size-3.5 object-contain"
				/>
				<span className="font-mono text-xs font-medium">+{energy}</span>
			</span>
			<span className="flex items-center gap-0.5">
				<img
					src={assetPath("images/misc/Health.png")}
					alt="Health"
					className="size-3.5 object-contain"
				/>
				<span className="font-mono text-xs font-medium">+{health}</span>
			</span>
		</span>
	);
}

interface EnergyHealthGridProps {
	energy: number;
	health: number;
	maxQuality: MaxQuality;
}

export function EnergyHealthGrid({ energy, health, maxQuality }: EnergyHealthGridProps) {
	if (maxQuality !== "iridium") {
		return (
			<div className="border-line inline-flex rounded-md border-[1.5px] px-2.5 py-1.5">
				<Pair energy={energy} health={health} />
			</div>
		);
	}
	const tiers = calc.energyHealth(energy, health);
	return (
		<div className="border-line grid grid-cols-4 overflow-hidden rounded-md border-[1.5px]">
			<div className="bg-bg flex flex-col items-center gap-1 px-1 py-1.5">
				<span className="text-muted font-mono text-[11px] uppercase">Basic</span>
				<Pair energy={energy} health={health} stacked />
			</div>
			{tiers.map(({ quality, icon, energy: tierEnergy, health: tierHealth }) => (
				<div
					key={quality}
					className="border-line flex flex-col items-center gap-1 border-s-[1.5px] px-1 py-1.5"
				>
					<img src={assetPath(icon)} alt={quality} className="size-4 object-contain" />
					<Pair energy={tierEnergy} health={tierHealth} stacked />
				</div>
			))}
		</div>
	);
}
