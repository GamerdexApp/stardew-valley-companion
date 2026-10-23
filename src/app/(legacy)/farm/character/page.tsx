"use client";

import { professions } from "stardew-valley-data";
import { useState } from "react";
import type { CharacterEditDraft, EditStep } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { toggleProfession } from "@/lib/pages/character";
import { AchievementsSection } from "@/comps/farm/character/AchievementsSection";
import { CharacterHeroCard } from "@/comps/farm/character/CharacterHeroCard";
import { ChildrenSection } from "@/comps/farm/character/ChildrenSection";
import {
	AchievementsEditStep,
	CharacterCoreEditStep,
	ChildrenEditStep,
	SkillsEditStep,
	StardropsEditStep,
	ToolsEditStep,
} from "@/comps/farm/character/edit";
import { MasterySection } from "@/comps/farm/character/MasterySection";
import { SkillsSection } from "@/comps/farm/character/SkillsSection";
import { StardropsSection } from "@/comps/farm/character/StardropsSection";
import { ToolsSection } from "@/comps/farm/character/ToolsSection";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function CharacterPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<CharacterEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="character data" />;
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleToggleProfession(profId: string) {
		const next = toggleProfession(profId, gameData.professions, professions().get());
		updatePlaythrough(playthroughId, {
			data: { ...gameData, professions: next },
		});
	}

	function handleOpenEdit() {
		setDraft({
			character: { ...gameData.character },
			toolLevels: { ...gameData.toolLevels },
			skills: { ...gameData.skills },
			professions: [...gameData.professions],
			mastery: { ...gameData.mastery, unlocked: [...gameData.mastery.unlocked] },
			stardrops: { ...gameData.stardrops },
			achievements: [...gameData.achievements],
			children: gameData.children.map((c) => ({ ...c })),
		});
		setEditOpen(true);
	}

	function handleSave(stepIndex: number) {
		if (!draft) return;
		const base = gameData;
		if (stepIndex === 0) {
			updatePlaythrough(playthroughId, {
				data: { ...base, character: draft.character },
			});
		} else if (stepIndex === 1) {
			updatePlaythrough(playthroughId, {
				data: {
					...base,
					toolLevels: draft.toolLevels,
					character: { ...base.character, maxItems: draft.character.maxItems },
				},
			});
		} else if (stepIndex === 2) {
			updatePlaythrough(playthroughId, {
				data: {
					...base,
					skills: draft.skills,
					professions: draft.professions,
					mastery: draft.mastery,
				},
			});
		} else if (stepIndex === 3) {
			updatePlaythrough(playthroughId, {
				data: { ...base, stardrops: draft.stardrops },
			});
		} else if (stepIndex === 4) {
			updatePlaythrough(playthroughId, {
				data: { ...base, achievements: draft.achievements },
			});
		} else if (stepIndex === 5) {
			updatePlaythrough(playthroughId, {
				data: { ...base, children: draft.children },
			});
		}
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Character",
					content: (
						<CharacterCoreEditStep
							character={draft.character}
							onChange={(character) => setDraft((d) => d && { ...d, character })}
						/>
					),
				},
				{
					label: "Tools",
					content: (
						<ToolsEditStep
							toolLevels={draft.toolLevels}
							maxItems={draft.character.maxItems}
							onToolLevelsChange={(toolLevels) =>
								setDraft((d) => d && { ...d, toolLevels })
							}
							onMaxItemsChange={(maxItems) =>
								setDraft(
									(d) => d && { ...d, character: { ...d.character, maxItems } }
								)
							}
						/>
					),
				},
				{
					label: "Skills",
					content: (
						<SkillsEditStep
							skills={draft.skills}
							professions={draft.professions}
							mastery={draft.mastery}
							onSkillsChange={(skills) => setDraft((d) => d && { ...d, skills })}
							onProfessionsChange={(profs) =>
								setDraft((d) => d && { ...d, professions: profs })
							}
							onMasteryChange={(mastery) => setDraft((d) => d && { ...d, mastery })}
						/>
					),
				},
				{
					label: "Stardrops",
					content: (
						<StardropsEditStep
							stardrops={draft.stardrops}
							onChange={(stardrops) => setDraft((d) => d && { ...d, stardrops })}
						/>
					),
				},
				{
					label: "Achievements",
					content: (
						<AchievementsEditStep
							achievements={draft.achievements}
							onChange={(achievements) =>
								setDraft((d) => d && { ...d, achievements })
							}
						/>
					),
				},
				{
					label: "Children",
					content: (
						<ChildrenEditStep
							items={draft.children}
							onChange={(children) => setDraft((d) => d && { ...d, children })}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Character"
				description="Your farmer's profile, skills, and progression"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<CharacterHeroCard gameData={gameData} />
				<ChildrenSection gameData={gameData} />
				<ToolsSection gameData={gameData} />
				<SkillsSection gameData={gameData} onToggleProfession={handleToggleProfession} />
				<MasterySection gameData={gameData} />
				<StardropsSection gameData={gameData} />
				<AchievementsSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Character"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
