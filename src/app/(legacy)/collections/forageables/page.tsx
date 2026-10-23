"use client";

import { useState } from "react";
import type { EditStep, ShippedEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { ForageablesShippedEditStep } from "@/comps/collections/forageables/edit";
import { ForageablesHero } from "@/comps/collections/forageables/ForageablesHero";
import { ForageablesSection } from "@/comps/collections/forageables/ForageablesSection";
import { TreesSection } from "@/comps/collections/forageables/TreesSection";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function ForageablesPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<ShippedEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="forageables" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({ shipped: { ...gameData.shipped } });
		setEditOpen(true);
	}

	function handleSave(_stepIndex: number) {
		if (!draft) return;
		updatePlaythrough(playthroughId, {
			data: { ...gameData, shipped: draft.shipped },
		});
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Forageables",
					content: (
						<ForageablesShippedEditStep
							shipped={draft.shipped}
							onChange={(shipped) => setDraft((d) => d && { ...d, shipped })}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Forageables"
				description="Wild-gathered items, tree produce, and tapper goods with sell prices and artisan uses"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<ForageablesHero gameData={gameData} />
				<ForageablesSection gameData={gameData} />
				<TreesSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Forageables"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
