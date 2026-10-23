"use client";

import { useState } from "react";
import type { EditStep } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { ArtisanGoodsHero } from "@/comps/collections/artisan-goods/ArtisanGoodsHero";
import { ArtisanGoodsSection } from "@/comps/collections/artisan-goods/ArtisanGoodsSection";
import { ArtisanGoodsShippedEditStep } from "@/comps/collections/artisan-goods/edit";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function ArtisanGoodsPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draftShipped, setDraftShipped] = useState<Record<
		string,
		{ shipped: boolean; count: number }
	> | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="artisan goods" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraftShipped({ ...gameData.shipped });
		setEditOpen(true);
	}

	function handleSave(_stepIndex: number) {
		if (!draftShipped) return;
		updatePlaythrough(playthroughId, {
			data: { ...gameData, shipped: draftShipped },
		});
	}

	const editSteps: EditStep[] = draftShipped
		? [
				{
					label: "Artisan Goods",
					content: (
						<ArtisanGoodsShippedEditStep
							shipped={draftShipped}
							onChange={setDraftShipped}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Artisan Goods"
				description="Processed goods, equipment sources, sell prices, and shipping progress"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<ArtisanGoodsHero gameData={gameData} />
				<ArtisanGoodsSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Artisan Goods"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
