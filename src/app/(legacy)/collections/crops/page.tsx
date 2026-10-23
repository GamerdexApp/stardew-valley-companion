"use client";

import { useState } from "react";
import type { EditStep, ShippedEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { CropsHero } from "@/comps/collections/crops/CropsHero";
import { CropsSection } from "@/comps/collections/crops/CropsSection";
import { CropsShippedEditStep } from "@/comps/collections/crops/edit";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function CropsPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<ShippedEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="crops" />;
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
					label: "Crops",
					content: (
						<CropsShippedEditStep
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
				title="Crops"
				description="Plantable crops, grow times, sell prices, and shipping progress"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<CropsHero gameData={gameData} />
				<CropsSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Crops"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
