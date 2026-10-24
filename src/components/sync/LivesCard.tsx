"use client";

import { DATA_FILE, META_FILE } from "@gamerdexapp/gamerdex-sync";
import { useSync } from "@/lib/contexts/SyncContext";
import { syncText } from "@/lib/messages/sync";
import { SYNC_APP_ID } from "@/lib/sync/device";
import { dataFolderOf } from "@/lib/sync/providerFactory";
import { usesRepository } from "@/lib/sync/providers";
import { formatNumber } from "@/lib/utils/formatting";
import { Card } from "@/comps/ui/Card";

const text = syncText.lives;

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
	return (
		<>
			<dt className="text-muted">{label}</dt>
			<dd className={`text-end break-words ${mono ? "font-mono text-xs" : ""}`}>
				{value.split("/").map((part, index) => (
					<span key={index}>
						{index > 0 && <wbr />}
						{index > 0 && "/"}
						{part}
					</span>
				))}
			</dd>
		</>
	);
}

export function LivesCard() {
	const { provider, repository, cloudCopy } = useSync();
	if (!provider) return null;

	const kilobytes = cloudCopy
		? Math.max(1, Math.round(JSON.stringify(cloudCopy, null, 2).length / 1024))
		: null;

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="text-base font-semibold">{text.title}</h2>
			<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
				<Row label={text.storage} value={syncText.provider[provider].name} mono={false} />
				{usesRepository(provider) && repository && (
					<Row label={syncText.connected.repository} value={repository} />
				)}
				<Row label={text.folder} value={dataFolderOf(provider, SYNC_APP_ID)} />
				<Row label={text.dataFile} value={DATA_FILE} />
				{kilobytes !== null && (
					<Row label={text.size} value={text.kb(formatNumber(kilobytes))} mono={false} />
				)}
				<Row label={text.metaFile} value={META_FILE} />
			</dl>
			<p className="text-muted">{text.note}</p>
			<p className="text-muted">{text[`${provider}Note`]}</p>
		</Card>
	);
}
