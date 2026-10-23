"use client";

import { useState } from "react";
import type { EditStep, VillagersEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";
import { BirthdaysSection } from "@/comps/villagers/BirthdaysSection";
import { VillagersEditStep } from "@/comps/villagers/edit";
import { VillagersHeroCard } from "@/comps/villagers/VillagersHeroCard";
import { VillagersSection } from "@/comps/villagers/VillagersSection";

export default function VillagersPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<VillagersEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="villagers" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({ villagers: { ...gameData.villagers } });
		setEditOpen(true);
	}

	function handleSave(_stepIndex: number) {
		if (!draft) return;
		updatePlaythrough(playthroughId, {
			data: { ...gameData, villagers: draft.villagers },
		});
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Villagers",
					content: (
						<VillagersEditStep
							villagers={draft.villagers}
							onChange={(villagers) => setDraft((d) => d && { ...d, villagers })}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Villagers"
				description="Friendships, heart events, birthdays, and gift preferences"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<VillagersHeroCard gameData={gameData} />
				<VillagersSection gameData={gameData} />
				<BirthdaysSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Villagers"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
