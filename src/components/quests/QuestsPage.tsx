"use client";

import { Suspense } from "react";
import type { Playthrough } from "@/types/app";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import { questsText } from "@/lib/messages/quests";
import { questsSummary } from "@/service/quests";
import { DEFAULT_QUESTS_TAB, QUESTS_TAB_IDS } from "@/data/quests";
import type { QuestsTabId } from "@/data/quests";
import { PageHeader } from "@/comps/shell/PageHeader";
import { PlaythroughGate } from "@/comps/shell/PlaythroughGate";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { Tabs } from "@/comps/ui/Tabs";
import { LostBooksTab } from "./LostBooksTab";
import { QuestsTab } from "./QuestsTab";
import { SecretNotesTab } from "./SecretNotesTab";

const text = questsText;

function Panel({ tab, playthrough }: { tab: QuestsTabId; playthrough: Playthrough }) {
	if (tab === "quests") return <QuestsTab playthrough={playthrough} />;
	if (tab === "secret-notes") return <SecretNotesTab playthrough={playthrough} />;
	return <LostBooksTab playthrough={playthrough} />;
}

function QuestsContent({ playthrough }: { playthrough: Playthrough }) {
	const [tab, setTab] = useUrlTab(QUESTS_TAB_IDS, DEFAULT_QUESTS_TAB);
	const s = questsSummary(playthrough.data);
	const tabs = [
		{ id: "quests" as const, label: text.tabs.quests, count: `${s.quests} / ${s.questsTotal}` },
		{
			id: "secret-notes" as const,
			label: text.tabs["secret-notes"],
			count: `${s.notes + s.scraps} / ${s.notesTotal + s.scrapsTotal}`,
		},
		{
			id: "lost-books" as const,
			label: text.tabs["lost-books"],
			count: `${s.books} / ${s.booksTotal}`,
		},
	];

	return (
		<>
			<PageHeader
				title={text.title}
				subline={text.subline(
					text.tabs[tab],
					`${s.quests} of ${s.questsTotal}`,
					`${s.town + s.qi} of ${s.townTotal + s.qiTotal}`,
					`${s.notes + s.scraps} of ${s.notesTotal + s.scrapsTotal}`
				)}
			/>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
				<SummaryTile label={text.tiles.quests} value={s.quests} total={s.questsTotal} />
				<SummaryTile label={text.tiles.town} value={s.town} total={s.townTotal} />
				<SummaryTile label={text.tiles.qi} value={s.qi} total={s.qiTotal} />
				<SummaryTile label={text.tiles.helpWanted} value={s.helpWanted} />
				<SummaryTile label={text.tiles.notes} value={s.notes} total={s.notesTotal} />
				<SummaryTile label={text.tiles.scraps} value={s.scraps} total={s.scrapsTotal} />
				<SummaryTile label={text.tiles.books} value={s.books} total={s.booksTotal} />
			</div>
			<Tabs label={text.tabsLabel} tabs={tabs} activeId={tab} onChange={setTab}>
				<div key={tab} className="flex flex-col gap-4">
					<Panel tab={tab} playthrough={playthrough} />
				</div>
			</Tabs>
		</>
	);
}

export function QuestsPage() {
	return (
		<PlaythroughGate title={text.title}>
			{(playthrough) => (
				<Suspense fallback={null}>
					<QuestsContent playthrough={playthrough} />
				</Suspense>
			)}
		</PlaythroughGate>
	);
}
