"use client";

import { useState } from "react";
import type { EditStep, ShippedEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { AnimalProductsHero } from "@/comps/collections/animal-products/AnimalProductsHero";
import { AnimalProductsSection } from "@/comps/collections/animal-products/AnimalProductsSection";
import { AnimalProductsShippedEditStep } from "@/comps/collections/animal-products/edit";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function AnimalProductsPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<ShippedEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="animal products" />;
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
					label: "Animal Products",
					content: (
						<AnimalProductsShippedEditStep
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
				title="Animal Products"
				description="Farm animal produce, quality sell prices, and shipping progress"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<AnimalProductsHero gameData={gameData} />
				<AnimalProductsSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Animal Products"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
