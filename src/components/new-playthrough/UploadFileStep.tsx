"use client";

import type { SaveData } from "stardew-valley-data";
import { newPlaythroughText } from "@/lib/messages/newPlaythrough";
import { defaultUploadName } from "@/service/newPlaythrough";
import { SaveFilePicker } from "@/comps/saves/SaveFilePicker";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { Note } from "@/comps/ui/Note";
import { Textarea } from "@/comps/ui/Textarea";

const text = newPlaythroughText.upload;

interface UploadFileStepProps {
	save: SaveData | null;
	name: string;
	description: string;
	onParsed: (save: SaveData | null) => void;
	onNameChange: (name: string) => void;
	onDescriptionChange: (description: string) => void;
}

export function UploadFileStep({
	save,
	name,
	description,
	onParsed,
	onNameChange,
	onDescriptionChange,
}: UploadFileStepProps) {
	const handleParsed = (parsed: SaveData | null) => {
		onParsed(parsed);
		if (parsed) onNameChange(defaultUploadName(parsed));
	};

	return (
		<div className="flex flex-col gap-4">
			<Note>
				<p className="font-medium">{text.infoLead}</p>
				<p className="mt-2">{text.locations}</p>
				<ul className="mt-1 list-inside list-disc">
					<li>
						<strong>{text.windows}</strong>{" "}
						<code className="font-mono text-xs break-all">{text.windowsPath}</code>
					</li>
					<li>
						<strong>{text.unix}</strong>{" "}
						<code className="font-mono text-xs break-all">{text.unixPath}</code>
					</li>
				</ul>
			</Note>
			<SaveFilePicker
				save={save}
				parsedMessage={(parsed) => text.parsed(parsed.player.name, parsed.player.farmName)}
				onParsed={handleParsed}
			/>
			{save && (
				<Field
					label={text.nameLabel}
					hint={text.nameHint}
					error={name.trim() === "" ? text.nameError : undefined}
				>
					<Input value={name} onChange={(event) => onNameChange(event.target.value)} />
				</Field>
			)}
			<Field label={text.descriptionLabel} optional>
				<Textarea
					rows={2}
					placeholder={text.descriptionPlaceholder}
					value={description}
					onChange={(event) => onDescriptionChange(event.target.value)}
				/>
			</Field>
		</div>
	);
}
