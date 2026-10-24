"use client";

import type { Playthrough } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import {
	islandSummary,
	setSpotFound,
	setUpgrade,
	setWalnutsFound,
	upgrades,
	WALNUT_TOTAL,
} from "@/service/gingerIsland";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { useFarmEdit } from "../useFarmEdit";
import { ParrotSection } from "./ParrotSection";
import { UpgradesSection } from "./UpgradesSection";
import { WalnutSpotsSection } from "./WalnutSpotsSection";
import { WalnutTotalSection } from "./WalnutTotalSection";

const text = farmText.gingerIsland.tiles;

export function GingerIslandTab({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const { edit } = useFarmEdit(playthrough.id, data);
	const summary = islandSummary(data);
	const complete = summary.found >= WALNUT_TOTAL;

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				<SummaryTile
					label={text.found}
					value={summary.found}
					total={WALNUT_TOTAL}
					emphasis={complete}
				/>
				<SummaryTile
					label={text.upgrades}
					value={summary.unlocked}
					total={upgrades.length}
					emphasis={summary.unlocked === upgrades.length}
				/>
				<SummaryTile
					label={text.available}
					value={complete ? text.complete : summary.available}
				/>
				<SummaryTile
					label={text.parrot}
					value={`${summary.parrotCost.toLocaleString()}g`}
				/>
			</div>
			<WalnutTotalSection
				summary={summary}
				onChange={(count) => edit((d) => setWalnutsFound(d, count))}
			/>
			<UpgradesSection
				data={data}
				onToggle={(id, unlocked) => edit((d) => setUpgrade(d, id, unlocked))}
			/>
			<WalnutSpotsSection
				data={data}
				onToggle={(id, found) => edit((d) => setSpotFound(d, id, found))}
			/>
			<ParrotSection summary={summary} />
		</>
	);
}
