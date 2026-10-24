"use client";

import { Suspense } from "react";
import type { Playthrough } from "@/types/app";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import { farmText } from "@/lib/messages/farm";
import { formatGameDate } from "@/service/playthroughList";
import { DEFAULT_FARM_TAB, FARM_TAB_IDS } from "@/data/farm";
import type { FarmTabId } from "@/data/farm";
import { PageHeader } from "@/comps/shell/PageHeader";
import { PlaythroughGate } from "@/comps/shell/PlaythroughGate";
import { Tabs } from "@/comps/ui/Tabs";
import { AnimalsTab } from "./animals/AnimalsTab";
import { BuildingsTab } from "./buildings/BuildingsTab";
import { CharacterTab } from "./character/CharacterTab";
import { GingerIslandTab } from "./ginger-island/GingerIslandTab";

const text = farmText;

const tabs = FARM_TAB_IDS.map((id) => ({ id, label: text.tabs[id] }));

function Panel({ tab, playthrough }: { tab: FarmTabId; playthrough: Playthrough }) {
	if (tab === "character") return <CharacterTab playthrough={playthrough} />;
	if (tab === "animals") return <AnimalsTab playthrough={playthrough} />;
	if (tab === "buildings") return <BuildingsTab playthrough={playthrough} />;
	return <GingerIslandTab playthrough={playthrough} />;
}

function FarmContent({ playthrough }: { playthrough: Playthrough }) {
	const [tab, setTab] = useUrlTab(FARM_TAB_IDS, DEFAULT_FARM_TAB);
	const farm = playthrough.data.character.farmName;

	return (
		<>
			<PageHeader
				title={text.title}
				subline={text.character.subline(
					text.tabs[tab],
					farm ? `${farm} Farm` : playthrough.name,
					formatGameDate(playthrough)
				)}
			/>
			<Tabs label={text.tabsLabel} tabs={tabs} activeId={tab} onChange={setTab}>
				<div key={tab} className="flex flex-col gap-4">
					<Panel tab={tab} playthrough={playthrough} />
				</div>
			</Tabs>
		</>
	);
}

export function FarmPage() {
	return (
		<PlaythroughGate title={text.title}>
			{(playthrough) => (
				<Suspense fallback={null}>
					<FarmContent playthrough={playthrough} />
				</Suspense>
			)}
		</PlaythroughGate>
	);
}
