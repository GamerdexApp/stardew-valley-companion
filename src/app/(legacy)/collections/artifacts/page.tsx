"use client";

import { useState } from "react";
import type { ArtifactsEditDraft, EditStep } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { ArtifactsHero } from "@/comps/collections/artifacts/ArtifactsHero";
import { ArtifactsSection } from "@/comps/collections/artifacts/ArtifactsSection";
import { ArtifactsEditStep } from "@/comps/collections/artifacts/edit";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function ArtifactsPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<ArtifactsEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="artifacts" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({ artifacts: { ...gameData.artifacts } });
		setEditOpen(true);
	}

	function handleSave(_stepIndex: number) {
		if (!draft) return;
		updatePlaythrough(playthroughId, {
			data: { ...gameData, artifacts: draft.artifacts },
		});
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Artifacts",
					content: (
						<ArtifactsEditStep
							artifacts={draft.artifacts}
							onChange={(artifacts) => setDraft((d) => d && { ...d, artifacts })}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Artifacts"
				description="Museum artifacts — track which ones you've found and donated"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<ArtifactsHero gameData={gameData} />
				<ArtifactsSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Artifacts"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
