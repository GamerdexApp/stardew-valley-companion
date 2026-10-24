"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { LuDownload, LuUpload } from "react-icons/lu";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useOptionalSync } from "@/lib/contexts/SyncContext";
import { settingsText } from "@/lib/messages/settings";
import { EMPTY_APP_DATA } from "@/service/appData";
import type { ImportMode } from "@/service/backup";
import { backupFileName, downloadBackup } from "@/service/backup";
import { PLAYTHROUGHS_HREF } from "@/data/nav";
import { Badge } from "@/comps/ui/Badge";
import { Button, ButtonLink } from "@/comps/ui/Button";
import { Note } from "@/comps/ui/Note";
import { useToast } from "@/comps/ui/Toast";
import { ImportDialog } from "./ImportDialog";
import type { ImportFile } from "./ImportDialog";
import { ResetDialog } from "./ResetDialog";
import { SettingsCard } from "./SettingsCard";

const text = settingsText.data;

export function DataTab() {
	const showToast = useToast();
	const { appData, playthroughs, updateData } = usePlaythrough();
	const sync = useOptionalSync();
	const syncProvider = sync?.status === "signedOut" ? null : (sync?.provider ?? null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [chosenFile, setChosenFile] = useState<File | null>(null);
	const [reviewedFile, setReviewedFile] = useState<ImportFile | null>(null);
	const [importMode, setImportMode] = useState<ImportMode>("merge");
	const [resetOpen, setResetOpen] = useState(false);

	const count = settingsText.playthroughCount(playthroughs.length);

	const exportBackup = () => {
		showToast({
			variant: "success",
			title: text.backupDownloaded,
			message: downloadBackup(appData),
		});
	};

	const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
		setChosenFile(event.target.files?.[0] ?? null);
	};

	const reviewImport = async () => {
		if (!chosenFile) return;
		setImportMode("merge");
		setReviewedFile({
			name: chosenFile.name,
			size: chosenFile.size,
			text: await chosenFile.text(),
		});
	};

	const confirmImport = (next: typeof appData, summary: string, mode: ImportMode) => {
		const previous = updateData(() => next);
		if (!previous) return;
		setReviewedFile(null);
		setChosenFile(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
		showToast({
			variant: "success",
			title: mode === "merge" ? text.merged : text.replaced,
			message: summary,
			action: { label: text.undo, onAction: () => updateData(() => previous) },
		});
	};

	const confirmReset = (alsoDeleteSyncedCopy: boolean) => {
		const disconnect = syncProvider !== null && !alsoDeleteSyncedCopy;
		const previous = updateData(() => EMPTY_APP_DATA);
		if (!previous) return;
		if (disconnect) sync?.signOut();
		setResetOpen(false);
		showToast({
			variant: "warning",
			title: text.resetDone,
			message:
				text.resetDoneMessage(previous.playthroughs.length) +
				(disconnect ? text.syncDisconnected : ""),
			action: { label: text.undo, onAction: () => updateData(() => previous) },
		});
	};

	return (
		<div className="grid items-start gap-4 lg:grid-cols-2">
			<div className="flex flex-col gap-4">
				<Note title={text.localStorageNote.title}>{text.localStorageNote.body}</Note>
				<SettingsCard
					title={text.management.title}
					description={text.management.description}
					aside={<Badge tone="added">{count}</Badge>}
				>
					<section className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
						<h3 className="font-medium">{text.export.title}</h3>
						<p className="text-muted">
							{text.export.description} {text.export.fileName}
							<code className="mt-1 block font-mono text-xs break-all">
								{backupFileName()}
							</code>
						</p>
						<div>
							<Button onClick={exportBackup}>
								<LuDownload size={16} aria-hidden="true" />
								{text.export.button}
							</Button>
						</div>
					</section>
					<section className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
						<h3 className="font-medium">{text.import.title}</h3>
						<p className="text-muted">{text.import.description}</p>
						<input
							ref={fileInputRef}
							type="file"
							accept=".json,application/json"
							aria-label={text.import.fileLabel}
							onChange={chooseFile}
							className="sr-only"
							tabIndex={-1}
						/>
						<div className="flex flex-wrap items-center gap-3">
							<Button onClick={() => fileInputRef.current?.click()}>
								<LuUpload size={16} aria-hidden="true" />
								{text.import.chooseFile}
							</Button>
							<span className="text-muted break-all">
								{chosenFile?.name ?? text.import.noFile}
							</span>
						</div>
						<div>
							<Button variant="primary" disabled={!chosenFile} onClick={reviewImport}>
								{text.import.review}
							</Button>
						</div>
					</section>
					<section className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
						<h3 className="font-medium">{text.reset.title}</h3>
						<Note tone="warning" title={text.reset.warningTitle}>
							{text.reset.warning}
						</Note>
						<div>
							<Button
								variant="danger"
								disabled={playthroughs.length === 0}
								onClick={() => setResetOpen(true)}
							>
								{text.reset.button}
							</Button>
						</div>
					</section>
				</SettingsCard>
			</div>
			<SettingsCard
				title={text.playthroughs.title}
				description={text.playthroughs.description}
				aside={<Badge tone="added">{count}</Badge>}
			>
				<div>
					<ButtonLink href={PLAYTHROUGHS_HREF}>{text.playthroughs.manage}</ButtonLink>
				</div>
			</SettingsCard>
			<ImportDialog
				file={reviewedFile}
				current={appData}
				mode={importMode}
				onModeChange={setImportMode}
				onClose={() => setReviewedFile(null)}
				onConfirm={confirmImport}
			/>
			<ResetDialog
				open={resetOpen}
				playthroughs={playthroughs}
				onClose={() => setResetOpen(false)}
				onExportBackup={exportBackup}
				syncProvider={syncProvider}
				onConfirm={confirmReset}
			/>
		</div>
	);
}
