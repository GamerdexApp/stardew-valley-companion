"use client";

import type { AppData, Playthrough } from "@/types/app";
import { playthroughsText } from "@/lib/messages/playthroughs";
import { downloadBackup } from "@/service/backup";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";

const text = playthroughsText.delete;

interface DeletePlaythroughDialogProps {
	playthrough: Playthrough | null;
	percent: number;
	isActive: boolean;
	nextActiveName: string | null;
	appData: AppData;
	onConfirm: (playthrough: Playthrough) => void;
	onClose: () => void;
}

export function DeletePlaythroughDialog({
	playthrough,
	percent,
	isActive,
	nextActiveName,
	appData,
	onConfirm,
	onClose,
}: DeletePlaythroughDialogProps) {
	return (
		<Dialog
			open={playthrough !== null}
			onClose={onClose}
			title={text.title(playthrough?.name ?? "")}
			description={text.description}
			footer={
				<>
					<Button data-autofocus onClick={onClose}>
						{text.cancel}
					</Button>
					<Button
						variant="danger"
						onClick={() => {
							if (playthrough) onConfirm(playthrough);
							onClose();
						}}
					>
						{text.confirm}
					</Button>
				</>
			}
		>
			{playthrough && (
				<>
					<div className="bg-bg flex flex-col gap-1 rounded-md p-3">
						<span className="truncate font-semibold">{playthrough.name}</span>
						<span className="text-muted text-xs">
							{text.facts(playthrough.platform ?? "Not set", percent)}
						</span>
						{isActive && (
							<p className="text-muted pt-1">
								{nextActiveName ? text.activeNext(nextActiveName) : text.activeLast}
							</p>
						)}
					</div>
					<div>
						<Button
							variant="ghost"
							className="text-link -ms-4"
							onClick={() => downloadBackup(appData)}
						>
							{text.exportFirst}
						</Button>
					</div>
				</>
			)}
		</Dialog>
	);
}
