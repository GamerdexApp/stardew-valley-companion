import type { GameData } from "@/types/app";
import { overviewText } from "@/lib/messages/overview";
import { milestoneTiles } from "@/service/overview";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { OverviewCard } from "./OverviewCard";

export function MilestonesCard({ data }: { data: GameData }) {
	return (
		<OverviewCard title={overviewText.milestones.title}>
			<ul className="grid grid-cols-2 gap-3">
				{milestoneTiles(data).map((tile) => (
					<li
						key={tile.label}
						className="bg-bg flex flex-col gap-1.5 rounded-md px-3 py-2.5"
					>
						<span className="text-muted text-xs">{tile.label}</span>
						<span className="font-mono text-lg">
							{tile.current}
							{tile.total !== undefined && (
								<span className="text-muted text-sm"> / {tile.total}</span>
							)}
						</span>
						{tile.total !== undefined && tile.total > 0 && (
							<ProgressBar value={tile.current / tile.total} label={tile.label} />
						)}
					</li>
				))}
			</ul>
		</OverviewCard>
	);
}
