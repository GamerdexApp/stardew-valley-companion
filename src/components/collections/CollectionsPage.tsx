"use client";

import { Suspense, useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import { collectionsText } from "@/lib/messages/collections";
import { tabCount } from "@/service/collections";
import { countCompleteSections, overviewSections } from "@/service/collectionsOverview";
import {
	COLLECTION_TAB_IDS,
	DEFAULT_COLLECTION_TAB,
	REBUILT_COLLECTION_TABS,
} from "@/data/collections";
import type { CollectionTabId } from "@/data/collections";
import { PageHeader } from "@/comps/shell/PageHeader";
import { PlaythroughGate } from "@/comps/shell/PlaythroughGate";
import { CollectionTabs } from "./CollectionTabs";
import { FishTab } from "./fish/FishTab";
import { NotRebuiltTab } from "./NotRebuiltTab";
import { OverviewTab } from "./overview/OverviewTab";

const text = collectionsText;

function Panel({ tab, playthrough }: { tab: CollectionTabId; playthrough: Playthrough }) {
	if (tab === "overview") return <OverviewTab data={playthrough.data} />;
	if (tab === "fish") return <FishTab playthrough={playthrough} />;
	return <NotRebuiltTab tab={tab} />;
}

const subline = (tab: CollectionTabId, playthrough: Playthrough): string => {
	const count = tabCount(tab, playthrough.data);
	const farm = playthrough.data.character.farmName;
	const farmLabel = farm ? `${farm} Farm` : playthrough.name;
	if (tab === "overview") {
		const sections = overviewSections(playthrough.data);
		return text.overview.subline(countCompleteSections(sections), sections.length, farmLabel);
	}
	if (tab === "fish" && count) {
		return text.fish.subline(count.current, count.total, farmLabel);
	}
	return text.tabs[tab];
};

function CollectionsContent({ playthrough }: { playthrough: Playthrough }) {
	const [tab, setTab] = useUrlTab(COLLECTION_TAB_IDS, DEFAULT_COLLECTION_TAB);
	const counts = useMemo(
		() =>
			Object.fromEntries(
				REBUILT_COLLECTION_TABS.map((id) => [id, tabCount(id, playthrough.data)])
			),
		[playthrough.data]
	);

	return (
		<>
			<PageHeader title={text.title} subline={subline(tab, playthrough)} />
			<CollectionTabs activeId={tab} counts={counts} onChange={setTab}>
				<Panel key={tab} tab={tab} playthrough={playthrough} />
			</CollectionTabs>
		</>
	);
}

export function CollectionsPage() {
	return (
		<PlaythroughGate title={text.title}>
			{(playthrough) => (
				<Suspense fallback={null}>
					<CollectionsContent playthrough={playthrough} />
				</Suspense>
			)}
		</PlaythroughGate>
	);
}
