"use client";

import { useMemo } from "react";
import type { AppData } from "@/types/app";
import { formatShortDate } from "@/lib/format";
import { settingsText } from "@/lib/messages/settings";
import type { ImportMode } from "@/service/backup";
import { applyImport, parseBackup, planImport, summarizeImport } from "@/service/backup";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Note } from "@/comps/ui/Note";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { ScrollRegion } from "@/comps/ui/ScrollRegion";

const text = settingsText.importDialog;

export interface ImportFile {
	name: string;
	size: number;
	text: string;
}

interface ImportDialogProps {
	file: ImportFile | null;
	current: AppData;
	mode: ImportMode;
	onModeChange: (mode: ImportMode) => void;
	onClose: () => void;
	onConfirm: (next: AppData, summary: string, mode: ImportMode) => void;
}

const modeOptions = (["merge", "replace"] as const).map((id) => ({
	id,
	label: text.modes[id],
}));

const formatSize = (bytes: number) =>
	bytes < 1024 ? text.bytes(bytes) : text.kilobytes(Math.max(1, Math.round(bytes / 1024)));

const formatDate = (iso?: string) => (iso ? formatShortDate(iso) : text.notThere);

export function ImportDialog({
	file,
	current,
	mode,
	onModeChange,
	onClose,
	onConfirm,
}: ImportDialogProps) {
	const parsed = useMemo(() => (file ? parseBackup(file.text) : null), [file]);
	const incoming = parsed?.ok ? parsed.data : null;
	const rows = useMemo(
		() => (incoming ? planImport(current, incoming, mode) : []),
		[current, incoming, mode]
	);
	const summary = summarizeImport(rows);

	return (
		<Dialog
			open={file !== null}
			onClose={onClose}
			title={text.title}
			description={file ? text.fileInfo(file.name, formatSize(file.size)) : undefined}
			footer={
				incoming ? (
					<>
						<Button onClick={onClose}>{text.cancel}</Button>
						<Button
							variant="primary"
							onClick={() =>
								onConfirm(applyImport(current, incoming, mode), summary, mode)
							}
						>
							{text[mode]}
						</Button>
					</>
				) : (
					<Button onClick={onClose}>{text.close}</Button>
				)
			}
		>
			{parsed && !parsed.ok && (
				<Note tone="warning" title={text.failedTitle}>
					{parsed.error}
				</Note>
			)}
			{incoming && (
				<>
					<Note title={text.checksTitle}>
						{text.checks(incoming.playthroughs.length)}
					</Note>
					<div className="flex flex-col gap-2">
						<h3 className="font-medium">{text.howToApply}</h3>
						<RadioGroup
							label={text.modeLabel}
							options={modeOptions}
							value={mode}
							onChange={onModeChange}
						/>
						<p className="text-muted">{text.modeNotes[mode]}</p>
					</div>
					<div className="flex flex-col gap-2">
						<h3 className="font-medium">{text.whatChanges}</h3>
						<ScrollRegion label={text.whatChanges}>
							<table className="w-full text-start">
								<thead className="text-muted text-xs">
									<tr>
										<th className="py-1 pe-3 font-medium">
											{text.columns.playthrough}
										</th>
										<th className="py-1 pe-3 font-medium">
											{text.columns.inFile}
										</th>
										<th className="py-1 pe-3 font-medium">
											{text.columns.onDevice}
										</th>
										<th className="py-1 font-medium">{text.columns.result}</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row, index) => (
										<tr
											key={index}
											className="border-line border-t-[1.5px] align-top"
										>
											<td className="py-2 pe-3 font-medium">{row.name}</td>
											<td className="py-2 pe-3">
												{formatDate(row.fileModified)}
											</td>
											<td className="py-2 pe-3">
												{formatDate(row.deviceModified)}
											</td>
											<td className="py-2">{text.results[row.result]}</td>
										</tr>
									))}
								</tbody>
							</table>
						</ScrollRegion>
						<p className="text-muted">{summary || text.noPlaythroughs}</p>
						<p className="text-muted">{text.undoNote}</p>
					</div>
				</>
			)}
		</Dialog>
	);
}
