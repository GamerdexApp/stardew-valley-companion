"use client";

import { useState } from "react";
import type { BuildingsEditDraft, EditStep } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { BuildingsHero } from "@/comps/farm/buildings/BuildingsHero";
import { BuildingsSection } from "@/comps/farm/buildings/BuildingsSection";
import { BuildingsEditStep } from "@/comps/farm/buildings/edit";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function BuildingsPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<BuildingsEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="buildings" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({ buildings: [...gameData.buildings] });
		setEditOpen(true);
	}

	function handleSave(_stepIndex: number) {
		if (!draft) return;
		updatePlaythrough(playthroughId, {
			data: { ...gameData, buildings: draft.buildings },
		});
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Buildings",
					content: (
						<BuildingsEditStep
							buildings={draft.buildings}
							onChange={(buildings) => setDraft((d) => d && { ...d, buildings })}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Buildings"
				description="Farm buildings, costs, and housed animals"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<BuildingsHero gameData={gameData} />
				<BuildingsSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Buildings"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
