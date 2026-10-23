"use client";

import { useState } from "react";
import type { CookingEditDraft, EditStep } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { CookingHero } from "@/comps/collections/cooking/CookingHero";
import { CookingSection } from "@/comps/collections/cooking/CookingSection";
import { CookingEditStep } from "@/comps/collections/cooking/edit";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function CookingPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<CookingEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="cooking" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({ cookingRecipes: { ...gameData.cookingRecipes } });
		setEditOpen(true);
	}

	function handleSave(_stepIndex: number) {
		if (!draft) return;
		updatePlaythrough(playthroughId, {
			data: { ...gameData, cookingRecipes: draft.cookingRecipes },
		});
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Cooking",
					content: (
						<CookingEditStep
							cookingRecipes={draft.cookingRecipes}
							onChange={(cookingRecipes) =>
								setDraft((d) => d && { ...d, cookingRecipes })
							}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Cooking"
				description="Cooking recipes, ingredients, buffs, and progress"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<CookingHero gameData={gameData} />
				<CookingSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Cooking"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
