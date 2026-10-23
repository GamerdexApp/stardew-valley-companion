"use client";

import { useState } from "react";
import type { CraftingEditDraft, EditStep } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { CraftingHero } from "@/comps/collections/crafting/CraftingHero";
import { CraftingSection } from "@/comps/collections/crafting/CraftingSection";
import { CraftingEditStep } from "@/comps/collections/crafting/edit";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function CraftingPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<CraftingEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="crafting" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({ craftingRecipes: { ...gameData.craftingRecipes } });
		setEditOpen(true);
	}

	function handleSave(_stepIndex: number) {
		if (!draft) return;
		updatePlaythrough(playthroughId, {
			data: { ...gameData, craftingRecipes: draft.craftingRecipes },
		});
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Crafting",
					content: (
						<CraftingEditStep
							craftingRecipes={draft.craftingRecipes}
							onChange={(craftingRecipes) =>
								setDraft((d) => d && { ...d, craftingRecipes })
							}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Crafting"
				description="Crafting recipes, ingredients, and progress"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<CraftingHero gameData={gameData} />
				<CraftingSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Crafting"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
