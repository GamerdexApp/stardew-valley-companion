import { MASTERY_LEVELS } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { getCurrentMasteryLevel } from "@/lib/pages/character";
import { assetPath } from "@/lib/utils/assetPath";
import {
	allSkills,
	isMastered,
	MAX_MASTERY_XP,
	setMastered,
	setMasteryXp,
} from "@/service/character";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { NumberInput } from "@/comps/ui/NumberInput";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { Switch } from "@/comps/ui/Switch";
import { Section } from "../Section";

const text = farmText.character.mastery;

interface MasterySectionProps {
	data: GameData;
	edit: (change: (current: GameData) => GameData) => void;
}

export function MasterySection({ data, edit }: MasterySectionProps) {
	const { masteryXp } = data.mastery;
	const level = getCurrentMasteryLevel(masteryXp);
	const next = MASTERY_LEVELS.find((item) => item.level === level + 1);
	const masteredCount = allSkills.filter((skill) => isMastered(data, skill.id)).length;

	return (
		<Section title={text.title} badge={text.mastered(masteredCount, allSkills.length)}>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-[16rem_1fr] md:items-end">
				<Field label={text.xp}>
					<NumberInput
						value={masteryXp}
						max={MAX_MASTERY_XP}
						onChange={(value) => edit((d) => setMasteryXp(d, value))}
					/>
				</Field>
				<div className="flex flex-col gap-1">
					<ProgressBar
						value={masteryXp / MAX_MASTERY_XP}
						label={text.title}
						tone="warn"
					/>
					<span className="text-muted text-xs">
						{text.level(masteryXp, level)}{" "}
						{next ? text.nextLevel(next.level, next.totalXp) : text.maxLevel}
					</span>
				</div>
			</div>
			<p className="text-muted text-xs">{text.thresholds}</p>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
				{allSkills.map((skill) => {
					const mastered = isMastered(data, skill.id);
					return (
						<Card
							key={skill.id}
							highlighted={mastered}
							className={`flex flex-col gap-2 p-3 ${mastered ? "bg-tint" : ""}`}
						>
							<div className="flex items-start gap-3">
								<img
									src={assetPath(skill.image)}
									alt=""
									className="size-10 shrink-0 object-contain [image-rendering:pixelated]"
								/>
								<span className="flex-1 font-semibold">{skill.name}</span>
								<div className="flex shrink-0 flex-col items-end gap-1">
									<Switch
										checked={mastered}
										onChange={(value) =>
											edit((d) => setMastered(d, skill.id, value))
										}
										label={text.switchLabel(skill.name)}
									/>
									<span
										className={`text-xs font-medium ${mastered ? "text-kept" : "text-muted"}`}
									>
										{mastered ? text.mastered1 : text.notMastered}
									</span>
								</div>
							</div>
							<ul className="flex flex-col gap-1.5">
								{skill.mastery.unlocks.map((unlock) => (
									<li key={unlock.name} className="flex flex-col">
										<span className="text-sm font-medium">{unlock.name}</span>
										<span className="text-muted text-xs">
											{unlock.description}
										</span>
									</li>
								))}
							</ul>
						</Card>
					);
				})}
			</div>
		</Section>
	);
}
