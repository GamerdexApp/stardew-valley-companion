import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { costsMoreThanLeft, islandSummary, isUnlocked, upgradesCost } from "@/service/gingerIsland";
import { ISLAND_UPGRADES } from "@/data/constants/gingerIsland";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { Switch } from "@/comps/ui/Switch";
import { Section } from "../Section";

const text = farmText.gingerIsland.upgrades;

interface UpgradesSectionProps {
	data: GameData;
	onToggle: (upgradeId: string, unlocked: boolean) => void;
}

export function UpgradesSection({ data, onToggle }: UpgradesSectionProps) {
	const { unlocked, available } = islandSummary(data);

	return (
		<Section title={text.title} badge={text.badge(unlocked, ISLAND_UPGRADES.length)}>
			<p className="text-muted text-sm">{text.note(upgradesCost)}</p>
			<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
				{ISLAND_UPGRADES.map((upgrade) => {
					const on = isUnlocked(data, upgrade.id);
					return (
						<Card key={upgrade.id} className="flex flex-col gap-2 p-3">
							<div className="flex items-start justify-between gap-3">
								<span className="font-semibold">{upgrade.name}</span>
								<Switch
									checked={on}
									onChange={(checked) => onToggle(upgrade.id, checked)}
									label={text.switch(upgrade.name)}
								/>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Badge tone={on ? "kept" : "locked"}>
									{on ? text.unlocked : text.locked}
								</Badge>
								<span className="text-muted font-mono text-xs">
									{text.cost(upgrade.cost)} · {upgrade.location}
								</span>
							</div>
							<p className="text-muted text-sm">{upgrade.description}</p>
							{costsMoreThanLeft(data, upgrade) && (
								<p className="text-warn text-xs font-medium">
									{text.warning(upgrade.cost, available)}
								</p>
							)}
						</Card>
					);
				})}
			</div>
		</Section>
	);
}
