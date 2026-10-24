"use client";

import type { Playthrough } from "@/types/app";
import { useFarmEdit } from "../useFarmEdit";
import { AchievementsSection } from "./AchievementsSection";
import { ChildrenSection } from "./ChildrenSection";
import { MapCard } from "./MapCard";
import { MasterySection } from "./MasterySection";
import { ProfileSection } from "./ProfileSection";
import { SkillsSection } from "./SkillsSection";
import { StardropsSection } from "./StardropsSection";
import { ToolsSection } from "./ToolsSection";

export function CharacterTab({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const { edit, editWithNote } = useFarmEdit(playthrough.id, data);

	const editWithUndo = (change: (current: typeof data) => typeof data, title: string) =>
		editWithNote(change, () => ({ title, undo: "Undo" }));

	return (
		<>
			<MapCard farmType={data.character.farmType} />
			<ProfileSection data={data} edit={edit} />
			<ChildrenSection data={data} edit={edit} editWithUndo={editWithUndo} />
			<ToolsSection data={data} edit={edit} />
			<SkillsSection data={data} editWithNote={editWithNote} />
			<MasterySection data={data} edit={edit} />
			<StardropsSection data={data} edit={edit} />
			<AchievementsSection data={data} edit={edit} />
		</>
	);
}
