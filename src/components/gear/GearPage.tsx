"use client";

import { Suspense } from "react";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import { gearText } from "@/lib/messages/gear";
import { gearCounts, gearTotal } from "@/service/gear";
import { DEFAULT_GEAR_TAB, GEAR_TAB_IDS } from "@/data/gear";
import type { GearTabId } from "@/data/gear";
import { PageHeader } from "@/comps/shell/PageHeader";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { Tabs } from "@/comps/ui/Tabs";
import { BaitTab, FootwearTab, HatsTab, RingsTab, TackleTab, TrinketsTab } from "./GearTabs";
import { WeaponsTab } from "./WeaponsTab";

const text = gearText;

const tabs = GEAR_TAB_IDS.map((id) => ({ id, label: text.tabs[id], count: gearCounts[id] }));

const panels: Record<GearTabId, () => React.ReactNode> = {
	weapons: () => <WeaponsTab />,
	footwear: () => <FootwearTab />,
	rings: () => <RingsTab />,
	hats: () => <HatsTab />,
	trinkets: () => <TrinketsTab />,
	bait: () => <BaitTab />,
	tackle: () => <TackleTab />,
};

function GearContent() {
	const [tab, setTab] = useUrlTab(GEAR_TAB_IDS, DEFAULT_GEAR_TAB);

	return (
		<>
			<PageHeader title={text.title} subline={text.subline(gearTotal)} />
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
				{GEAR_TAB_IDS.map((id) => (
					<SummaryTile
						key={id}
						label={text.tabs[id]}
						value={gearCounts[id]}
						emphasis={id === tab}
					/>
				))}
				<SummaryTile label={text.total} value={gearTotal} />
			</div>
			<Tabs label={text.tabsLabel} tabs={tabs} activeId={tab} onChange={setTab}>
				<div key={tab} className="flex flex-col gap-4">
					{panels[tab]()}
				</div>
			</Tabs>
		</>
	);
}

export function GearPage() {
	return (
		<Suspense fallback={null}>
			<GearContent />
		</Suspense>
	);
}
