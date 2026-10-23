"use client";

import { useState } from "react";
import type { AnimalsEditDraft, EditStep } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { AnimalsHero } from "@/comps/farm/animals/AnimalsHero";
import { AnimalsEditStep, PetsEditStep } from "@/comps/farm/animals/edit";
import { FarmAnimalsSection } from "@/comps/farm/animals/FarmAnimalsSection";
import { PetsSection } from "@/comps/farm/animals/PetsSection";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function AnimalsPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<AnimalsEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="animals" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({
			animals: [...gameData.animals],
			pets: [...gameData.pets],
			buildings: [...gameData.buildings],
		});
		setEditOpen(true);
	}

	function handleSave(stepIndex: number) {
		if (!draft) return;
		if (stepIndex === 0) {
			updatePlaythrough(playthroughId, {
				data: { ...gameData, animals: draft.animals },
			});
		} else if (stepIndex === 1) {
			updatePlaythrough(playthroughId, {
				data: { ...gameData, pets: draft.pets },
			});
		}
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Animals",
					content: (
						<AnimalsEditStep
							animals={draft.animals}
							buildings={draft.buildings}
							onChange={(animals) => setDraft((d) => d && { ...d, animals })}
						/>
					),
				},
				{
					label: "Pets",
					content: (
						<PetsEditStep
							pets={draft.pets}
							onChange={(pets) => setDraft((d) => d && { ...d, pets })}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Animals"
				description="Your farm animals, pets, and buildings"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<AnimalsHero gameData={gameData} />
				<FarmAnimalsSection gameData={gameData} />
				<PetsSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Animals"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
