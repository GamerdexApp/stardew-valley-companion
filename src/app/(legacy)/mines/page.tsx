"use client";

import { useState } from "react";
import type { EditStep, MinesEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { MinesEditStep, MonsterKillsEditStep } from "@/comps/mines/edit";
import { MinesHero } from "@/comps/mines/MinesHero";
import { MonstersSection } from "@/comps/mines/MonstersSection";
import { SlayerGoalsSection } from "@/comps/mines/SlayerGoalsSection";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function MinesPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<MinesEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="mines & monsters" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({
			mineProgress: { ...gameData.mineProgress },
			monsters: { ...gameData.monsters },
		});
		setEditOpen(true);
	}

	function handleSave(stepIndex: number) {
		if (!draft) return;
		if (stepIndex === 0) {
			updatePlaythrough(playthroughId, {
				data: { ...gameData, mineProgress: draft.mineProgress },
			});
		} else if (stepIndex === 1) {
			updatePlaythrough(playthroughId, {
				data: { ...gameData, monsters: draft.monsters },
			});
		}
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Mine Progress",
					content: (
						<MinesEditStep
							mineProgress={draft.mineProgress}
							onChange={(mineProgress) =>
								setDraft((d) => d && { ...d, mineProgress })
							}
						/>
					),
				},
				{
					label: "Monster Kills",
					content: (
						<MonsterKillsEditStep
							monsters={draft.monsters}
							onChange={(monsters) => setDraft((d) => d && { ...d, monsters })}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Mines & Monsters"
				description="Mine progress, slayer goals, and monster bestiary"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<MinesHero gameData={gameData} />
				<SlayerGoalsSection gameData={gameData} />
				<MonstersSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Mine Progress"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
