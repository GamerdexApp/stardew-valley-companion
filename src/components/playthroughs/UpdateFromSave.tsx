"use client";

import type { SaveData } from "stardew-valley-data";
import { useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { playthroughsText } from "@/lib/messages/playthroughs";
import { mapSaveDataToGameData } from "@/lib/utils/saveFileMapper";
import { applySaveUpdate, changesBySection, countChanges } from "@/service/saveUpdate";
import type { SaveUpdateMode } from "@/service/saveUpdate";
import { SaveFilePicker } from "@/comps/saves/SaveFilePicker";
import { Note } from "@/comps/ui/Note";
import { RadioGroup } from "@/comps/ui/RadioGroup";

const text = playthroughsText.edit.update;

const MOST_CHANGED_SHOWN = 4;

const humanize = (field: string) => {
	const words = field.replace(/([A-Z])/g, " $1").toLowerCase();
	return words.charAt(0).toUpperCase() + words.slice(1);
};

interface UpdateFromSaveProps {
	playthrough: Playthrough;
	save: SaveData | null;
	mode: SaveUpdateMode;
	onParsed: (save: SaveData | null) => void;
	onModeChange: (mode: SaveUpdateMode) => void;
}

export function UpdateFromSave({
	playthrough,
	save,
	mode,
	onParsed,
	onModeChange,
}: UpdateFromSaveProps) {
	const preview = useMemo(() => {
		if (!save) return null;
		const fromSave = mapSaveDataToGameData(save);
		const result = (chosen: SaveUpdateMode) =>
			applySaveUpdate(playthrough.data, fromSave, chosen);
		return {
			fill: result("fill"),
			replace: result("replace"),
		};
	}, [playthrough.data, save]);

	const counts = preview && {
		fill: countChanges(playthrough.data, preview.fill),
		replace: countChanges(playthrough.data, preview.replace),
	};
	const mostChanged = preview
		? changesBySection(playthrough.data, preview[mode]).slice(0, MOST_CHANGED_SHOWN)
		: [];
	const ownFarm = playthrough.data.character.farmName;
	const differentFarm = save && ownFarm.trim() !== "" && save.player.farmName !== ownFarm;

	const modeOptions = (["fill", "replace"] as const).map((id) => ({
		id,
		label: `${text.modes[id]}${counts ? ` · ${text.willChange(counts[id])}` : ""}`,
	}));

	return (
		<section className="border-line flex flex-col gap-3 border-t-[1.5px] pt-4">
			<h3 className="font-semibold">{text.title}</h3>
			<p className="text-muted">{text.intro}</p>
			<SaveFilePicker
				save={save}
				parsedMessage={(parsed) => text.parsed(parsed.player.name, parsed.player.farmName)}
				onParsed={onParsed}
			/>
			{save && differentFarm && (
				<Note tone="warning">{text.farmMismatch(save.player.farmName, ownFarm)}</Note>
			)}
			{save && counts && (
				<div className="flex flex-col gap-2">
					<h4 className="font-medium">{text.howLabel}</h4>
					<RadioGroup
						label={text.howLabel}
						options={modeOptions}
						value={mode}
						onChange={onModeChange}
					/>
					<p className="text-muted">{text.modeNotes[mode]}</p>
					{mostChanged.length > 0 && (
						<p className="text-muted text-xs">
							{text.mostChanges}{" "}
							{mostChanged
								.map(({ field, count }) => `${humanize(field)} (${count})`)
								.join(", ")}
						</p>
					)}
				</div>
			)}
		</section>
	);
}
