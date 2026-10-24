"use client";

import { Suspense, useMemo } from "react";
import type { ReactElement } from "react";
import type { Playthrough } from "@/types/app";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import { collectionsText } from "@/lib/messages/collections";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import { tabCount } from "@/service/collections";
import { countCompleteSections, overviewSections } from "@/service/collectionsOverview";
import { cookingSummary } from "@/service/cooking";
import { craftingSummary } from "@/service/crafting";
import { COLLECTION_TAB_IDS, DEFAULT_COLLECTION_TAB } from "@/data/collections";
import type { CollectionTabId } from "@/data/collections";
import { PageHeader } from "@/comps/shell/PageHeader";
import { PlaythroughGate } from "@/comps/shell/PlaythroughGate";
import { AnimalProductsTab } from "./animal-products/AnimalProductsTab";
import { ArtifactsTab } from "./artifacts/ArtifactsTab";
import { ArtisanGoodsTab } from "./artisan-goods/ArtisanGoodsTab";
import { CollectionTabs } from "./CollectionTabs";
import { CookingTab } from "./cooking/CookingTab";
import { CraftingTab } from "./crafting/CraftingTab";
import { CropsTab } from "./crops/CropsTab";
import { FishTab } from "./fish/FishTab";
import { ForageablesTab } from "./forageables/ForageablesTab";
import { MineralsTab } from "./minerals/MineralsTab";
import { MonsterLootTab } from "./monster-loot/MonsterLootTab";
import { OverviewTab } from "./overview/OverviewTab";
import { RarecrowsTab } from "./rarecrows/RarecrowsTab";
import { SpecialItemsTab } from "./special-items/SpecialItemsTab";

const text = collectionsText;

const PANELS: Record<CollectionTabId, (playthrough: Playthrough) => ReactElement> = {
	overview: (playthrough) => <OverviewTab data={playthrough.data} />,
	fish: (playthrough) => <FishTab playthrough={playthrough} />,
	artifacts: (playthrough) => <ArtifactsTab playthrough={playthrough} />,
	minerals: (playthrough) => <MineralsTab playthrough={playthrough} />,
	cooking: (playthrough) => <CookingTab playthrough={playthrough} />,
	crafting: (playthrough) => <CraftingTab playthrough={playthrough} />,
	crops: (playthrough) => <CropsTab playthrough={playthrough} />,
	forageables: (playthrough) => <ForageablesTab playthrough={playthrough} />,
	"animal-products": (playthrough) => <AnimalProductsTab playthrough={playthrough} />,
	"artisan-goods": (playthrough) => <ArtisanGoodsTab playthrough={playthrough} />,
	"monster-loot": (playthrough) => <MonsterLootTab playthrough={playthrough} />,
	rarecrows: (playthrough) => <RarecrowsTab playthrough={playthrough} />,
	"special-items": (playthrough) => <SpecialItemsTab playthrough={playthrough} />,
};

type SublineMaker = (playthrough: Playthrough, count: ProgressCount, farm: string) => string;

/** A tab whose line is "done of total" and the farm. */
const countLine =
	(line: (done: number, total: number, farm: string) => string): SublineMaker =>
	(_playthrough, count, farm) =>
		line(count.current, count.total, farm);

const countedDonated = (entries: Record<string, { found: boolean; donated: boolean }>): number =>
	Object.values(entries).filter((entry) => entry.found && entry.donated).length;

const SUBLINES: Record<Exclude<CollectionTabId, "overview">, SublineMaker> = {
	fish: countLine(text.fish.subline),
	artifacts: (playthrough, count, farm) =>
		text.artifacts.subline(
			count.current,
			count.total,
			countedDonated(playthrough.data.artifacts),
			farm
		),
	minerals: (playthrough, count, farm) =>
		text.minerals.subline(
			count.current,
			count.total,
			countedDonated(playthrough.data.minerals),
			farm
		),
	cooking: (playthrough, _count, farm) => {
		const summary = cookingSummary(playthrough.data);
		return text.cooking.subline(
			summary.cooked.current,
			summary.cooked.total,
			summary.learned,
			farm
		);
	},
	crafting: (playthrough, _count, farm) => {
		const summary = craftingSummary(playthrough.data);
		return text.crafting.subline(
			summary.crafted.current,
			summary.crafted.total,
			summary.learned,
			farm
		);
	},
	crops: countLine(text.crops.subline),
	forageables: countLine(text.forageables.subline),
	"animal-products": countLine(text.animalProducts.subline),
	"artisan-goods": countLine(text.artisanGoods.subline),
	"monster-loot": countLine(text.monsterLoot.subline),
	rarecrows: countLine(text.rarecrows.subline),
	"special-items": countLine(text.specialItems.subline),
};

const subline = (tab: CollectionTabId, playthrough: Playthrough): string => {
	const farm = playthrough.data.character.farmName;
	const farmLabel = farm ? `${farm} Farm` : playthrough.name;
	if (tab === "overview") {
		const sections = overviewSections(playthrough.data);
		return text.overview.subline(countCompleteSections(sections), sections.length, farmLabel);
	}
	return SUBLINES[tab](playthrough, tabCount(tab, playthrough.data)!, farmLabel);
};

function CollectionsContent({ playthrough }: { playthrough: Playthrough }) {
	const [tab, setTab] = useUrlTab(COLLECTION_TAB_IDS, DEFAULT_COLLECTION_TAB);
	const counts = useMemo(
		() =>
			Object.fromEntries(
				COLLECTION_TAB_IDS.map((id) => [id, tabCount(id, playthrough.data)])
			),
		[playthrough.data]
	);

	return (
		<>
			<PageHeader title={text.title} subline={subline(tab, playthrough)} />
			<CollectionTabs activeId={tab} counts={counts} onChange={setTab}>
				<div key={tab} className="flex flex-col gap-4">
					{PANELS[tab](playthrough)}
				</div>
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
