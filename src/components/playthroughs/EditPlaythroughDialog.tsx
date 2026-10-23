"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import type { Platform, Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { playthroughsText } from "@/lib/messages/playthroughs";
import { PLATFORMS } from "@/data/constants/platforms";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Textarea } from "@/comps/ui/Textarea";
import { useToast } from "@/comps/ui/Toast";

const text = playthroughsText.edit;

type PlatformChoice = Platform | "";

const platformOptions: { id: PlatformChoice; label: string }[] = [
	{ id: "", label: text.notSet },
	...PLATFORMS.map((platform) => ({ id: platform, label: platform })),
];

interface EditFormProps {
	playthrough: Playthrough;
	formId: string;
	onClose: () => void;
}

function EditForm({ playthrough, formId, onClose }: EditFormProps) {
	const { updatePlaythrough } = usePlaythrough();
	const showToast = useToast();
	const [name, setName] = useState(playthrough.name);
	const [description, setDescription] = useState(playthrough.description ?? "");
	const [platform, setPlatform] = useState<PlatformChoice>(playthrough.platform ?? "");
	const [showError, setShowError] = useState(false);

	const trimmedName = name.trim();

	const submit = (event: FormEvent) => {
		event.preventDefault();
		if (trimmedName === "") {
			setShowError(true);
			return;
		}
		updatePlaythrough(playthrough.id, {
			name: trimmedName,
			description: description.trim() || undefined,
			platform: platform || undefined,
		});
		showToast({
			variant: "success",
			title: text.saved,
			message: text.savedMessage(trimmedName),
		});
		onClose();
	};

	return (
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
			<div className="flex flex-col gap-1.5">
				<SegmentedControl
					label={text.platformLabel}
					options={platformOptions}
					value={platform}
					onChange={setPlatform}
				/>
				<p className="text-muted text-xs">{text.platformHelp}</p>
			</div>
		</form>
	);
}

interface EditPlaythroughDialogProps {
	playthrough: Playthrough | null;
	onClose: () => void;
}

export function EditPlaythroughDialog({ playthrough, onClose }: EditPlaythroughDialogProps) {
	const formId = useId();

	return (
		<Dialog
			open={playthrough !== null}
			onClose={onClose}
			title={text.title}
			description={playthrough ? text.description(playthrough.name) : undefined}
			footer={
				<>
					<Button onClick={onClose}>{text.cancel}</Button>
					<Button type="submit" form={formId} variant="primary">
						{text.save}
					</Button>
				</>
			}
		>
			{playthrough && (
				<EditForm playthrough={playthrough} formId={formId} onClose={onClose} />
			)}
		</Dialog>
	);
}
