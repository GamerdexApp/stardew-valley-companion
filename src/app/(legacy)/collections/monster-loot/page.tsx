"use client";

import { useState } from "react";
import type { EditStep, ShippedEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { MonsterLootShippedEditStep } from "@/comps/collections/monster-loot/edit";
import { MonsterLootHero } from "@/comps/collections/monster-loot/MonsterLootHero";
import { MonsterLootSection } from "@/comps/collections/monster-loot/MonsterLootSection";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function MonsterLootPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<ShippedEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="monster loot" />;
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
					label: "Monster Loot",
					content: (
						<MonsterLootShippedEditStep
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
				title="Monster Loot"
				description="Items dropped by monsters and shipping progress"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<MonsterLootHero gameData={gameData} />
				<MonsterLootSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Monster Loot"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
