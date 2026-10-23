"use client";

import { useState } from "react";
import type { EditStep, RarecrowsEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { RarecrowsEditStep } from "@/comps/collections/rarecrows/edit";
import { RarecrowsHero } from "@/comps/collections/rarecrows/RarecrowsHero";
import { RarecrowsSection } from "@/comps/collections/rarecrows/RarecrowsSection";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function RarecrowsPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<RarecrowsEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="rarecrows" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	console.log(gameData);

	function handleOpenEdit() {
		setDraft({ rarecrows: [...(gameData.rarecrows ?? [])] });
		setEditOpen(true);
	}

	function handleSave(_stepIndex: number) {
		if (!draft) return;
		updatePlaythrough(playthroughId, {
			data: { ...gameData, rarecrows: draft.rarecrows },
		});
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Rarecrows",
					content: (
						<RarecrowsEditStep
							rarecrows={draft.rarecrows}
							onChange={(rarecrows) => setDraft((d) => d && { ...d, rarecrows })}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Rarecrows"
				description="Decorative scarecrows obtained from various sources"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<RarecrowsHero gameData={gameData} />
				<RarecrowsSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Rarecrows"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
