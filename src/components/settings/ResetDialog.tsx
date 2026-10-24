"use client";

import { useState } from "react";
import type { Playthrough } from "@/types/app";
import { settingsText } from "@/lib/messages/settings";
import { syncText } from "@/lib/messages/sync";
import type { SyncProviderId } from "@/lib/sync/providers";
import { Button } from "@/comps/ui/Button";
import { Checkbox } from "@/comps/ui/Checkbox";
import { Dialog } from "@/comps/ui/Dialog";
import { Note } from "@/comps/ui/Note";

const text = settingsText.resetDialog;

interface ResetDialogProps {
	open: boolean;
	playthroughs: Playthrough[];
	onClose: () => void;
	onExportBackup: () => void;
	/** The provider that sync is connected to, or null while sync is off. */
	syncProvider: SyncProviderId | null;
	onConfirm: (alsoDeleteSyncedCopy: boolean) => void;
}

export function ResetDialog({
	open,
	playthroughs,
	onClose,
	onExportBackup,
	syncProvider,
	onConfirm,
}: ResetDialogProps) {
	const [alsoDeleteSyncedCopy, setAlsoDeleteSyncedCopy] = useState(false);

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
					<Button variant="danger" onClick={() => onConfirm(alsoDeleteSyncedCopy)}>
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
			{syncProvider && (
				<div className="flex flex-col gap-1">
					<Checkbox
						label={text.syncedCopy(syncText.provider[syncProvider].name)}
						checked={alsoDeleteSyncedCopy}
						onChange={setAlsoDeleteSyncedCopy}
					/>
					<p className="text-muted">
						{alsoDeleteSyncedCopy ? text.syncedOn : text.syncedOff}
					</p>
				</div>
			)}
			<Note>{text.undoNote}</Note>
			<div>
				<Button variant="ghost" className="text-link -ms-4" onClick={onExportBackup}>
					{text.exportFirst}
				</Button>
			</div>
		</Dialog>
	);
}
