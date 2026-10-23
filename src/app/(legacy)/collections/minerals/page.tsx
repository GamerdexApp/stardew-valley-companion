"use client";

import { useState } from "react";
import type { EditStep, MineralsEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { BarsSection } from "@/comps/collections/minerals/BarsSection";
import { MineralsMuseumEditStep, MineralsShippedEditStep } from "@/comps/collections/minerals/edit";
import { GeodesSection } from "@/comps/collections/minerals/GeodesSection";
import { MineralItemsSection } from "@/comps/collections/minerals/MineralItemsSection";
import { MineralsHero } from "@/comps/collections/minerals/MineralsHero";
import { NodesSection } from "@/comps/collections/minerals/NodesSection";
import { OresSection } from "@/comps/collections/minerals/OresSection";
import { ResourcesSection } from "@/comps/collections/minerals/ResourcesSection";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function MineralsPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<MineralsEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="minerals" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({
			minerals: { ...gameData.minerals },
			shipped: { ...gameData.shipped },
		});
		setEditOpen(true);
	}

	function handleSave(stepIndex: number) {
		if (!draft) return;
		if (stepIndex === 0) {
			updatePlaythrough(playthroughId, {
				data: { ...gameData, minerals: draft.minerals },
			});
		} else if (stepIndex === 1) {
			updatePlaythrough(playthroughId, {
				data: { ...gameData, shipped: draft.shipped },
			});
		}
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Museum",
					content: (
						<MineralsMuseumEditStep
							minerals={draft.minerals}
							onChange={(minerals) => setDraft((d) => d && { ...d, minerals })}
						/>
					),
				},
				{
					label: "Shipped",
					content: (
						<MineralsShippedEditStep
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
				title="Minerals"
				description="Mine collectibles — track gems, geodes, ores, bars, resources, and mining nodes"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<MineralsHero gameData={gameData} />
				<MineralItemsSection gameData={gameData} />
				<GeodesSection />
				<OresSection gameData={gameData} />
				<BarsSection gameData={gameData} />
				<ResourcesSection gameData={gameData} />
				<NodesSection />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Minerals"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
