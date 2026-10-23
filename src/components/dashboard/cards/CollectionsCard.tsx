"use client";

import type { DashboardProps } from "@/types";
import { countCraftingMade, countFishCaught } from "@/lib/utils/collectionCounts";
import { DASHBOARD_DATA } from "@/data/constants/dashboard";
import { NavySection } from "@/comps/ui/NavySection";

const { shippableItems, allCooking, allMineralItems, allArtifacts } = DASHBOARD_DATA;

interface CollectionRow {
	label: string;
	current: number;
	total: number;
}

export function CollectionsCard({ gameData }: DashboardProps) {
	const rows: CollectionRow[] = [
		{
			label: "Items Shipped",
			current: shippableItems.filter((item) => gameData.shipped[item.id]?.shipped).length,
			total: shippableItems.length,
		},
		{
			label: "Fish Caught",
			...countFishCaught(gameData),
		},
		{
			label: "Recipes Cooked",
			current: Object.values(gameData.cookingRecipes).filter((r) => r.cooked).length,
			total: allCooking.length,
		},
		{
			label: "Recipes Crafted",
			...countCraftingMade(gameData),
		},
		{
			label: "Minerals Donated",
			current: allMineralItems.filter((m) => gameData.minerals[m.id]?.donated).length,
			total: allMineralItems.length,
		},
		{
			label: "Artifacts Donated",
			current: Object.values(gameData.artifacts).filter((a) => a.donated).length,
			total: allArtifacts.length,
		},
	];

	return (
		<NavySection title="Collections">
			<div className="flex flex-col">
				{rows.map(({ label, current, total }) => {
					const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
					const isComplete = current >= total;
					const barColor = isComplete
						? "bg-green-400"
						: pct >= 60
							? "bg-accent"
							: "bg-red-400";
					const pctColor = isComplete ? "text-green-300" : "text-highlight";

					return (
						<div
							key={label}
							className="flex items-center gap-3 border-b border-white/6 py-2 last:border-b-0"
						>
							<span className="w-32 shrink-0 text-[0.75rem] font-semibold text-white/80">
								{label}
							</span>
							<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
								<div
									className={`h-full rounded-full ${barColor}`}
									style={{ width: `${pct}%` }}
								/>
							</div>
							<span className="w-14 shrink-0 text-right text-[0.65rem] font-semibold text-white/80">
								{current} / {total}
							</span>
							<span
								className={`w-8 shrink-0 text-right text-[0.65rem] font-bold ${pctColor}`}
							>
								{Math.round(pct)}%
							</span>
						</div>
					);
				})}
			</div>
		</NavySection>
	);
}
