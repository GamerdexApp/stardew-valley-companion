"use client";

import type { SaveData } from "stardew-valley-data";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import type { Platform, Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { playthroughsText } from "@/lib/messages/playthroughs";
import { mapSaveDataToGameData } from "@/lib/utils/saveFileMapper";
import { updatePlaythrough } from "@/service/appData";
import { applySaveUpdate, countChanges } from "@/service/saveUpdate";
import type { SaveUpdateMode } from "@/service/saveUpdate";
import { PLATFORMS } from "@/data/constants/platforms";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { Select } from "@/comps/ui/Select";
import { Textarea } from "@/comps/ui/Textarea";
import { useToast } from "@/comps/ui/Toast";
import { UpdateFromSave } from "./UpdateFromSave";

const text = playthroughsText.edit;

type PlatformChoice = Platform | "";

interface EditDialogContentProps {
	playthrough: Playthrough;
	onClose: () => void;
}

/**
 * Mounted only while the dialog is open, so every open starts from the saved values.
 */
function EditDialogContent({ playthrough, onClose }: EditDialogContentProps) {
	const formId = useId();
	const { updateData } = usePlaythrough();
	const showToast = useToast();
	const [name, setName] = useState(playthrough.name);
	const [description, setDescription] = useState(playthrough.description ?? "");
	const [platform, setPlatform] = useState<PlatformChoice>(playthrough.platform ?? "");
	const [save, setSave] = useState<SaveData | null>(null);
	const [mode, setMode] = useState<SaveUpdateMode>("fill");
	const [showError, setShowError] = useState(false);

	const trimmedName = name.trim();

	const submit = (event: FormEvent) => {
		event.preventDefault();
		if (trimmedName === "") {
			setShowError(true);
			return;
		}
		const data = save
			? applySaveUpdate(playthrough.data, mapSaveDataToGameData(save), mode)
			: playthrough.data;
		const previous = updateData((current) =>
			updatePlaythrough(current, playthrough.id, {
				name: trimmedName,
				description: description.trim() || undefined,
				platform: platform || undefined,
				data,
			})
		);
		if (!previous) return;

		if (save) {
			showToast({
				variant: "success",
				title: text.update.done,
				message: text.update.doneMessage(trimmedName, countChanges(playthrough.data, data)),
				action: {
					label: text.update.undo,
					onAction: () => updateData(() => previous),
				},
			});
		} else {
			showToast({
				variant: "success",
				title: text.saved,
				message: text.savedMessage(trimmedName),
			});
		}
		onClose();
	};

	return (
		<Dialog
			open
			onClose={onClose}
			variant="wide"
			title={text.title}
			description={text.description(playthrough.name)}
			footer={
				<>
					<Button onClick={onClose}>{text.cancel}</Button>
					<Button type="submit" form={formId} variant="primary">
						{save ? text.update.button : text.save}
					</Button>
				</>
			}
		>
			<form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
				<Field
					label={text.nameLabel}
					error={showError && trimmedName === "" ? text.nameError : undefined}
					labelAction={
						<span className="text-muted ms-auto font-mono text-xs uppercase">
							{text.nameRequired}
						</span>
					}
				>
					<Input
						value={name}
						onChange={(event) => setName(event.target.value)}
						maxLength={60}
						data-autofocus
					/>
				</Field>
				<Field label={text.descriptionLabel} optional>
					<Textarea
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						rows={3}
					/>
				</Field>
				<Field label={text.platformLabel} hint={text.platformHelp}>
					<Select
						value={platform}
						onChange={(event) => setPlatform(event.target.value as PlatformChoice)}
					>
						<option value="">{text.notSet}</option>
						{PLATFORMS.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</Select>
				</Field>
				<UpdateFromSave
					playthrough={playthrough}
					save={save}
					mode={mode}
					onParsed={setSave}
					onModeChange={setMode}
				/>
			</form>
		</Dialog>
	);
}

interface EditPlaythroughDialogProps {
	playthrough: Playthrough | null;
	onClose: () => void;
}

export function EditPlaythroughDialog({ playthrough, onClose }: EditPlaythroughDialogProps) {
	return playthrough ? <EditDialogContent playthrough={playthrough} onClose={onClose} /> : null;
}
