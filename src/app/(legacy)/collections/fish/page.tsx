"use client";

import { useState } from "react";
import type { EditStep, FishEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { FishEditStep } from "@/comps/collections/fish/edit";
import { FishHero } from "@/comps/collections/fish/FishHero";
import { FishSection } from "@/comps/collections/fish/FishSection";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function FishPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<FishEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="fish" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({ fishCaught: [...gameData.fishCaught] });
		setEditOpen(true);
	}

	function handleSave(_stepIndex: number) {
		if (!draft) return;
		updatePlaythrough(playthroughId, {
			data: { ...gameData, fishCaught: draft.fishCaught },
		});
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Fish",
					content: (
						<FishEditStep
							fishCaught={draft.fishCaught}
							onChange={(fishCaught) => setDraft((d) => d && { ...d, fishCaught })}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Fish"
				description="All catchable fish with locations, seasons, difficulty, and sell prices"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<FishHero gameData={gameData} />
				<FishSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Fish"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
