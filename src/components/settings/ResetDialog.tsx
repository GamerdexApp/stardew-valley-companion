"use client";

import type { Playthrough } from "@/types/app";
import { settingsText } from "@/lib/messages/settings";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Note } from "@/comps/ui/Note";

const text = settingsText.resetDialog;

interface ResetDialogProps {
	open: boolean;
	playthroughs: Playthrough[];
	onClose: () => void;
	onExportBackup: () => void;
	onConfirm: () => void;
}

export function ResetDialog({
	open,
	playthroughs,
	onClose,
	onExportBackup,
	onConfirm,
}: ResetDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={text.title}
			footer={
				<>
					<Button data-autofocus onClick={onClose}>
						{text.cancel}
					</Button>
					<Button variant="danger" onClick={onConfirm}>
						{text.confirm}
					</Button>
				</>
			}
		>
			<p className="font-medium">{text.question(playthroughs.length)}</p>
			<div className="flex flex-col gap-1">
				<h3 className="text-muted text-xs">{text.removedTitle}</h3>
				<ul className="list-inside list-disc">
					{playthroughs.map((playthrough) => (
						<li key={playthrough.id}>{playthrough.name}</li>
					))}
				</ul>
			</div>
			<p className="text-muted">{text.settingsNote}</p>
			<Note>{text.undoNote}</Note>
			<div>
				<Button variant="ghost" className="text-link -ms-4" onClick={onExportBackup}>
					{text.exportFirst}
				</Button>
			</div>
		</Dialog>
	);
}
