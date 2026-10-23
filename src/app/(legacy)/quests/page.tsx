"use client";

import { TabItem, Tabs } from "flowbite-react";
import { lostBooks, quests, secretNotes } from "stardew-valley-data";
import { useState } from "react";
import type { EditStep, QuestsEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { tabTitle } from "@/lib/utils/tabTitle";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NotesBooksEditStep, QuestsEditStep, SpecialOrdersEditStep } from "@/comps/quests/edit";
import { QuestsHero } from "@/comps/quests/QuestsHero";
import { LostBooksTab, QuestsTab, SecretNotesTab } from "@/comps/quests/tabs";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

const questCount = quests().get().length;
const noteCount = secretNotes().get().length;
const bookCount = lostBooks().get().length;

export default function QuestsPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<QuestsEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="quests" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({
			questsCompleted: { ...gameData.questsCompleted },
			specialOrdersCompleted: { ...gameData.specialOrdersCompleted },
			secretNotes: { ...gameData.secretNotes },
			lostBooks: { ...gameData.lostBooks },
			helpWantedCompleted: gameData.helpWantedCompleted,
			lostBooksFound: gameData.lostBooksFound,
		});
		setEditOpen(true);
	}

	function handleSave(stepIndex: number) {
		if (!draft) return;
		if (stepIndex === 0) {
			updatePlaythrough(playthroughId, {
				data: {
					...gameData,
					questsCompleted: draft.questsCompleted,
					helpWantedCompleted: draft.helpWantedCompleted,
				},
			});
		} else if (stepIndex === 1) {
			updatePlaythrough(playthroughId, {
				data: { ...gameData, specialOrdersCompleted: draft.specialOrdersCompleted },
			});
		} else if (stepIndex === 2) {
			updatePlaythrough(playthroughId, {
				data: {
					...gameData,
					secretNotes: draft.secretNotes,
					lostBooks: draft.lostBooks,
					lostBooksFound: draft.lostBooksFound,
				},
			});
		}
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Quests",
					content: (
						<QuestsEditStep
							questsCompleted={draft.questsCompleted}
							helpWantedCompleted={draft.helpWantedCompleted}
							onQuestsChange={(questsCompleted) =>
								setDraft((d) => d && { ...d, questsCompleted })
							}
							onHelpWantedChange={(helpWantedCompleted) =>
								setDraft((d) => d && { ...d, helpWantedCompleted })
							}
						/>
					),
				},
				{
					label: "Special Orders",
					content: (
						<SpecialOrdersEditStep
							specialOrdersCompleted={draft.specialOrdersCompleted}
							onChange={(specialOrdersCompleted) =>
								setDraft((d) => d && { ...d, specialOrdersCompleted })
							}
						/>
					),
				},
				{
					label: "Notes & Books",
					content: (
						<NotesBooksEditStep
							secretNotes={draft.secretNotes}
							lostBooks={draft.lostBooks}
							lostBooksFound={draft.lostBooksFound}
							onNotesChange={(secretNotes) =>
								setDraft((d) => d && { ...d, secretNotes })
							}
							onBooksChange={(lostBooks) => setDraft((d) => d && { ...d, lostBooks })}
							onLostBooksFoundChange={(lostBooksFound) =>
								setDraft((d) => d && { ...d, lostBooksFound })
							}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Quests"
				description="Quests, secret notes, and lost books"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<QuestsHero gameData={gameData} />

				<Tabs variant="underline">
					<TabItem title={tabTitle(`Quests (${questCount})`)}>
						<QuestsTab gameData={gameData} />
					</TabItem>
					<TabItem title={tabTitle(`Secret Notes (${noteCount})`)}>
						<SecretNotesTab gameData={gameData} />
					</TabItem>
					<TabItem title={tabTitle(`Lost Books (${bookCount})`)}>
						<LostBooksTab gameData={gameData} />
					</TabItem>
				</Tabs>
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Quests"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
