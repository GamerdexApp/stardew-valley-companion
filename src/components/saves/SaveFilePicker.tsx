"use client";

import type { SaveData } from "stardew-valley-data";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { LuUpload } from "react-icons/lu";
import { newPlaythroughText } from "@/lib/messages/newPlaythrough";
import { parseSave } from "@/service/newPlaythrough";
import { Button } from "@/comps/ui/Button";
import { Note } from "@/comps/ui/Note";

const text = newPlaythroughText.upload;

interface SaveFilePickerProps {
	save: SaveData | null;
	parsedMessage: (save: SaveData) => string;
	/** Called with the parsed save, or null while a file is being read and when it cannot be read. */
	onParsed: (save: SaveData | null) => void;
}

/**
 * The file has no extension filter, because a Stardew save file has no extension.
 */
export function SaveFilePicker({ save, parsedMessage, onParsed }: SaveFilePickerProps) {
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
	};

	return (
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
					{parsedMessage(save)}
				</p>
			)}
		</div>
	);
}
