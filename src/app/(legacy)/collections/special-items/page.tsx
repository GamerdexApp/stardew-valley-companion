"use client";

import { useState } from "react";
import type { EditStep, SpecialItemsEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { SpecialItemsEditStep } from "@/comps/collections/special-items/edit";
import { SpecialItemsHero } from "@/comps/collections/special-items/SpecialItemsHero";
import { SpecialItemsSection } from "@/comps/collections/special-items/SpecialItemsSection";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function SpecialItemsPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<SpecialItemsEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="special items" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({
			specialItems: [...gameData.specialItems],
			books: [...gameData.books],
		});
		setEditOpen(true);
	}

	function handleSave(_stepIndex: number) {
		if (!draft) return;
		updatePlaythrough(playthroughId, {
			data: { ...gameData, specialItems: draft.specialItems, books: draft.books },
		});
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Special Items",
					content: (
						<SpecialItemsEditStep
							specialItems={draft.specialItems}
							books={draft.books}
							onSpecialItemsChange={(specialItems) =>
								setDraft((d) => d && { ...d, specialItems })
							}
							onBooksChange={(books) => setDraft((d) => d && { ...d, books })}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Special Items"
				description="Powers, books, and mastery unlocks"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<SpecialItemsHero gameData={gameData} />
				<SpecialItemsSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Special Items"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
