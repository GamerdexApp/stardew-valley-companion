"use client";

import { useSync } from "@/lib/contexts/SyncContext";
import { formatDateTime } from "@/lib/format";
import { syncText } from "@/lib/messages/sync";
import type { ActivityEntry } from "@/lib/sync/device";
import { Card } from "@/comps/ui/Card";

const text = syncText.activity;

const describe = (entry: ActivityEntry) => {
	if (entry.kind === "connected") return text.connected(syncText.provider[entry.provider].name);
	if (entry.kind === "conflicts") return text.conflicts(entry.count ?? 0);
	return text[entry.kind];
};

export function ActivityCard() {
	const { activity } = useSync();

	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="text-base font-semibold">{text.title}</h2>
			{activity.length === 0 ? (
				<p className="text-muted">{text.empty}</p>
			) : (
				<ul className="flex flex-col">
					{activity.map((entry) => (
						<li
							key={`${entry.at}-${entry.kind}`}
							className="border-line grid grid-cols-[10.5rem_1fr] gap-3 border-t py-2.5 first:border-t-0"
						>
							<span className="text-muted font-mono text-xs">
								{formatDateTime(entry.at)}
							</span>
							<span>{describe(entry)}</span>
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}
