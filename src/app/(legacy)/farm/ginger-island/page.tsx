"use client";

import { useState } from "react";
import type { EditStep, GingerIslandEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { IslandUpgradesEditStep, WalnutsEditStep } from "@/comps/farm/ginger-island/edit";
import { GingerIslandHero } from "@/comps/farm/ginger-island/GingerIslandHero";
import { IslandUpgradesSection } from "@/comps/farm/ginger-island/IslandUpgradesSection";
import { ParrotCalculatorSection } from "@/comps/farm/ginger-island/ParrotCalculatorSection";
import { WalnutsSection } from "@/comps/farm/ginger-island/WalnutsSection";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function GingerIslandPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<GingerIslandEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="ginger island" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({
			islandUpgrades: { ...gameData.islandUpgrades },
			goldenWalnuts: { ...gameData.goldenWalnuts },
			goldenWalnutsFound: gameData.goldenWalnutsFound,
		});
		setEditOpen(true);
	}

	function handleSave(stepIndex: number) {
		if (!draft) return;
		if (stepIndex === 0) {
			updatePlaythrough(playthroughId, {
				data: {
					...gameData,
					islandUpgrades: draft.islandUpgrades,
					goldenWalnutsFound: draft.goldenWalnutsFound,
				},
			});
		} else if (stepIndex === 1) {
			updatePlaythrough(playthroughId, {
				data: { ...gameData, goldenWalnuts: draft.goldenWalnuts },
			});
		}
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Upgrades",
					content: (
						<IslandUpgradesEditStep
							islandUpgrades={draft.islandUpgrades}
							goldenWalnutsFound={draft.goldenWalnutsFound}
							onUpgradesChange={(islandUpgrades) =>
								setDraft((d) => d && { ...d, islandUpgrades })
							}
							onFoundChange={(goldenWalnutsFound) =>
								setDraft((d) => d && { ...d, goldenWalnutsFound })
							}
						/>
					),
				},
				{
					label: "Walnuts",
					content: (
						<WalnutsEditStep
							goldenWalnuts={draft.goldenWalnuts}
							onChange={(goldenWalnuts) =>
								setDraft((d) => d && { ...d, goldenWalnuts })
							}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Ginger Island"
				description="Island upgrades, golden walnuts, and parrot calculator"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<GingerIslandHero gameData={gameData} />
				<IslandUpgradesSection gameData={gameData} />
				<WalnutsSection gameData={gameData} />
				<ParrotCalculatorSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Ginger Island"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
