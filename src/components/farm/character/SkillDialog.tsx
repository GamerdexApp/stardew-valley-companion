"use client";

import type { ProfessionData, Skill } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { assetPath } from "@/lib/utils/assetPath";
import {
	allProfessions,
	canPickProfession,
	MAX_SKILL_LEVEL,
	MAX_SKILL_XP,
	pickProfession,
	professionChange,
	setSkillLevel,
	setSkillXp,
	skillLevel,
	skillXp,
} from "@/service/character";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { NumberInput } from "@/comps/ui/NumberInput";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { lostProfessionsNote } from "./skillNotes";

const text = farmText.character.skills;
const copy = farmText.character.skillDialog;

export type EditWithNote = (
	change: (current: GameData) => GameData,
	note: (before: GameData, after: GameData) => { title: string; undo: string } | null
) => void;

interface SkillDialogProps {
	skill: Skill | null;
	data: GameData;
	editWithNote: EditWithNote;
	onClose: () => void;
}

const names = (list: ProfessionData[]) => list.map((profession) => profession.name).join(", ");

function ProfessionOption({
	profession,
	data,
	onPick,
}: {
	profession: ProfessionData;
	data: GameData;
	onPick: () => void;
}) {
	const chosen = data.professions.includes(profession.id);
	const reachable = canPickProfession(data, profession);
	return (
		<button
			type="button"
			aria-pressed={chosen}
			disabled={!reachable && !chosen}
			onClick={onPick}
			className={`flex min-h-11 w-full flex-col items-start gap-0.5 rounded-md border-[1.5px] px-3 py-2 text-start disabled:cursor-not-allowed disabled:opacity-50 ${
				chosen ? "border-primary bg-tint" : "border-line bg-surface hover:bg-tint"
			}`}
		>
			<span className="font-medium">
				{profession.name}
				{chosen && <span className="text-kept ms-2 text-xs">{copy.chosenLabel}</span>}
			</span>
			<span className="text-muted text-xs">{profession.description}</span>
		</button>
	);
}

export function SkillDialog({ skill, data, editWithNote, onClose }: SkillDialogProps) {
	const editSkill = (change: (current: GameData) => GameData) =>
		editWithNote(change, lostProfessionsNote);
	const level = skill ? skillLevel(data, skill.id) : 0;
	const lv5 = skill
		? allProfessions.filter((item) => item.skill === skill.name && item.level === 5)
		: [];
	const lv10 = skill
		? allProfessions.filter((item) => item.skill === skill.name && item.level === 10)
		: [];

	const pick = (profession: ProfessionData) =>
		editWithNote(
			(d) => pickProfession(d, profession.id),
			(before, after) => {
				const change = professionChange(before, after);
				const chosen = after.professions.includes(profession.id);
				const others = change.added.filter((item) => item.id !== profession.id);
				const parts = [
					chosen ? copy.chosen(profession.name) : copy.cleared(profession.name),
					others.length > 0 ? copy.alsoAdded(names(others)) : "",
					change.removed.length > 0 && chosen ? copy.removed(names(change.removed)) : "",
				].filter(Boolean);
				return { title: parts.join(" "), undo: copy.undo };
			}
		);

	const levelBlock = (levelNumber: number) => {
		if (!skill) return null;
		const info = skill.levels[levelNumber - 1];
		const recipes = [
			...info.recipes.crafting,
			...info.recipes.cooking,
			...info.recipes.additional,
		];
		const reached = level >= levelNumber;
		return (
			<li
				key={levelNumber}
				className={`flex flex-col gap-1 rounded-md border-[1.5px] p-3 ${
					reached ? "border-primary bg-tint" : "border-line bg-surface"
				}`}
			>
				<span className="flex flex-wrap items-center justify-between gap-2">
					<span className="font-semibold">{copy.level(levelNumber)}</span>
					<span className={`text-xs font-medium ${reached ? "text-kept" : "text-muted"}`}>
						{reached ? copy.current : copy.locked}
					</span>
				</span>
				<span className="text-muted font-mono text-xs">{copy.xpTotal(info.totalXp)}</span>
				{levelNumber !== 5 && levelNumber !== 10 && (
					<span className="text-sm">
						{recipes.length > 0 ? recipes.join(", ") : copy.noRecipes}
					</span>
				)}
				{levelNumber === 5 && (
					<div className="flex flex-col gap-1.5">
						<span className="text-muted text-xs">{copy.chooseOne}</span>
						{lv5.map((profession) => (
							<ProfessionOption
								key={profession.id}
								profession={profession}
								data={data}
								onPick={() => pick(profession)}
							/>
						))}
					</div>
				)}
				{levelNumber === 10 && (
					<div className="flex flex-col gap-2">
						<span className="text-muted text-xs">{copy.choosePerBranch}</span>
						{lv5.map((parent) => (
							<div key={parent.id} className="flex flex-col gap-1.5">
								<span className="text-muted text-xs font-medium">
									{copy.ifParent(parent.name)}
								</span>
								{lv10
									.filter(
										(profession) => profession.parentProfession === parent.id
									)
									.map((profession) => (
										<ProfessionOption
											key={profession.id}
											profession={profession}
											data={data}
											onPick={() => pick(profession)}
										/>
									))}
							</div>
						))}
					</div>
				)}
			</li>
		);
	};

	return (
		<Dialog
			open={skill !== null}
			onClose={onClose}
			title={skill?.name ?? ""}
			description={skill ? `${skill.description} ${skill.toolBonus}.` : undefined}
			variant="wide"
			footer={<Button onClick={onClose}>{copy.close}</Button>}
		>
			{skill && (
				<>
					<div className="flex flex-wrap items-center gap-3">
						<img
							loading="lazy"
							decoding="async"
							src={assetPath(skill.image)}
							alt=""
							className="size-10 shrink-0 object-contain [image-rendering:pixelated]"
						/>
						<ValueStepper
							label={text.level(skill.name)}
							value={level}
							min={0}
							max={MAX_SKILL_LEVEL}
							onChange={(value) =>
								editSkill((d) => setSkillLevel(d, skill.id, value))
							}
						/>
						<span className="flex items-center gap-2">
							<span className="text-muted font-mono text-xs uppercase">XP</span>
							<NumberInput
								aria-label={text.xp(skill.name)}
								className="w-32"
								value={skillXp(data, skill.id)}
								max={MAX_SKILL_XP}
								onChange={(value) =>
									editSkill((d) => setSkillXp(d, skill.id, value))
								}
							/>
						</span>
					</div>
					<section className="flex flex-col gap-2">
						<h3 className="font-semibold">{copy.levels15}</h3>
						<ul className="flex flex-col gap-2">{[1, 2, 3, 4, 5].map(levelBlock)}</ul>
					</section>
					<section className="flex flex-col gap-2">
						<h3 className="font-semibold">{copy.levels610}</h3>
						<ul className="flex flex-col gap-2">{[6, 7, 8, 9, 10].map(levelBlock)}</ul>
					</section>
					<p className="text-muted text-xs">{copy.rules}</p>
				</>
			)}
		</Dialog>
	);
}
