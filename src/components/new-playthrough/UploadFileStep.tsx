"use client";

import type { SaveData } from "stardew-valley-data";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { LuUpload } from "react-icons/lu";
import { newPlaythroughText } from "@/lib/messages/newPlaythrough";
import { defaultUploadName, parseSave } from "@/service/newPlaythrough";
import { Button } from "@/comps/ui/Button";
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
	const inputRef = useRef<HTMLInputElement>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [isParsing, setIsParsing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setFileName(file.name);
		setError(null);
		onParsed(null);
		setIsParsing(true);
		const parsed = parseSave(await file.text());
		setIsParsing(false);

		if (!parsed.ok) {
			setError(parsed.error);
			return;
		}
		onParsed(parsed.save);
		onNameChange(defaultUploadName(parsed.save));
	};

	return (
		<div className="flex flex-col gap-4">
			<Note>
				{text.infoLead} {text.locations} {text.windows}{" "}
				<code className="font-mono text-xs break-all">{text.windowsPath}</code> {text.unix}{" "}
				<code className="font-mono text-xs break-all">{text.unixPath}</code>
			</Note>
			<div className="flex flex-col gap-2">
				<input
					ref={inputRef}
					type="file"
					aria-label={text.chooseFile}
					onChange={chooseFile}
					disabled={isParsing}
					className="sr-only"
					tabIndex={-1}
				/>
				<div className="flex flex-wrap items-center gap-3">
					<Button disabled={isParsing} onClick={() => inputRef.current?.click()}>
						<LuUpload size={16} aria-hidden="true" />
						{text.chooseFile}
					</Button>
					{fileName && (
						<span className="text-muted break-all">{text.selected(fileName)}</span>
					)}
				</div>
				<p className="text-muted text-xs">{text.fileHint}</p>
			</div>
			{isParsing && (
				<p role="status" className="text-muted">
					{text.parsing}
				</p>
			)}
			{error && (
				<div role="alert">
					<Note tone="warning">{error}</Note>
				</div>
			)}
			{save && (
				<p role="status" className="text-kept font-medium">
					{text.parsed(save.player.name, save.player.farmName)}
				</p>
			)}
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
