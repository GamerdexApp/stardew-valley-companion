"use client";

import type { Skill } from "stardew-valley-data";
import { useState } from "react";
import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { computeXpBarPercent } from "@/lib/pages/character";
import { assetPath } from "@/lib/utils/assetPath";
import {
	allProfessions,
	allSkills,
	MAX_SKILL_LEVEL,
	MAX_SKILL_XP,
	setSkillLevel,
	setSkillXp,
	skillLevel,
	skillsTotal,
	skillXp,
} from "@/service/character";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { NumberInput } from "@/comps/ui/NumberInput";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { Section } from "../Section";
import { SkillDialog } from "./SkillDialog";
import type { EditWithNote } from "./SkillDialog";
import { lostProfessionsNote } from "./skillNotes";

const text = farmText.character.skills;

interface SkillsSectionProps {
	data: GameData;
	editWithNote: EditWithNote;
}

export const professionAt = (data: GameData, skill: Skill, level: 5 | 10): string | null => {
	const chosen = allProfessions.find(
		(profession) =>
			profession.skill === skill.name &&
			profession.level === level &&
			data.professions.includes(profession.id)
	);
	return chosen?.name ?? null;
};

export function SkillsSection({ data, editWithNote }: SkillsSectionProps) {
	const [open, setOpen] = useState<Skill | null>(null);
	const editSkill = (change: (current: GameData) => GameData) =>
		editWithNote(change, lostProfessionsNote);

	return (
		<Section
			title={text.title}
			badge={text.total(skillsTotal(data), allSkills.length * MAX_SKILL_LEVEL)}
			description={text.hint}
		>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
				{allSkills.map((skill) => {
					const level = skillLevel(data, skill.id);
					const xp = skillXp(data, skill.id);
					const next = level >= MAX_SKILL_LEVEL ? null : skill.levels[level].totalXp;
					const p5 = professionAt(data, skill, 5);
					const p10 = professionAt(data, skill, 10);
					return (
						<Card key={skill.id} className="flex flex-col gap-3 p-3">
							<div className="flex items-center gap-3">
								<img
									src={assetPath(skill.image)}
									alt=""
									className="size-10 shrink-0 object-contain [image-rendering:pixelated]"
								/>
								<span className="flex-1 font-semibold">{skill.name}</span>
								<ValueStepper
									label={text.level(skill.name)}
									value={level}
									min={0}
									max={MAX_SKILL_LEVEL}
									onChange={(value) =>
										editSkill((d) => setSkillLevel(d, skill.id, value))
									}
								/>
							</div>
							<div className="flex flex-col gap-1">
								<ProgressBar
									value={computeXpBarPercent(skill, xp, level) / 100}
									label={text.xp(skill.name)}
									tone={level >= MAX_SKILL_LEVEL ? "warn" : "primary"}
								/>
								<span className="text-muted font-mono text-xs">
									{text.xpOf(xp, next)}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-muted font-mono text-xs uppercase">XP</span>
								<NumberInput
									aria-label={text.xp(skill.name)}
									value={xp}
									max={MAX_SKILL_XP}
									onChange={(value) =>
										editSkill((d) => setSkillXp(d, skill.id, value))
									}
								/>
							</div>
							<ul className="flex flex-col gap-1 text-xs">
								<li className={p5 ? "font-medium" : "text-muted"}>
									{p5 ? `${text.levelBadge(5)} · ${p5}` : text.reach(5)}
								</li>
								<li className={p10 ? "font-medium" : "text-muted"}>
									{p10 ? `${text.levelBadge(10)} · ${p10}` : text.reach(10)}
								</li>
							</ul>
							<Button
								variant="link"
								onClick={() => setOpen(skill)}
								aria-haspopup="dialog"
								className="self-start"
							>
								{text.openLabel}
								<span className="sr-only"> {skill.name}</span>
							</Button>
						</Card>
					);
				})}
			</div>
			<SkillDialog
				skill={open}
				data={data}
				editWithNote={editWithNote}
				onClose={() => setOpen(null)}
			/>
		</Section>
	);
}
