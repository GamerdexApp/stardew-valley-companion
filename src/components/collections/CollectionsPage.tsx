"use client";

import { Suspense, useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import { collectionsText } from "@/lib/messages/collections";
import { tabCount } from "@/service/collections";
import { countCompleteSections, overviewSections } from "@/service/collectionsOverview";
import { cookingSummary } from "@/service/cooking";
import { craftingSummary } from "@/service/crafting";
import {
	COLLECTION_TAB_IDS,
	DEFAULT_COLLECTION_TAB,
	REBUILT_COLLECTION_TABS,
} from "@/data/collections";
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
import { NotRebuiltTab } from "./NotRebuiltTab";
import { OverviewTab } from "./overview/OverviewTab";

const text = collectionsText;

function Panel({ tab, playthrough }: { tab: CollectionTabId; playthrough: Playthrough }) {
	if (tab === "overview") return <OverviewTab data={playthrough.data} />;
	if (tab === "artisan-goods") return <ArtisanGoodsTab playthrough={playthrough} />;
	if (tab === "animal-products") return <AnimalProductsTab playthrough={playthrough} />;
	if (tab === "monster-loot") return <MonsterLootTab playthrough={playthrough} />;
	if (tab === "forageables") return <ForageablesTab playthrough={playthrough} />;
	if (tab === "crops") return <CropsTab playthrough={playthrough} />;
	if (tab === "crafting") return <CraftingTab playthrough={playthrough} />;
	if (tab === "cooking") return <CookingTab playthrough={playthrough} />;
	if (tab === "minerals") return <MineralsTab playthrough={playthrough} />;
	if (tab === "artifacts") return <ArtifactsTab playthrough={playthrough} />;
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
	if (tab === "artifacts") {
		const donated = Object.values(playthrough.data.artifacts).filter(
			(entry) => entry.found && entry.donated
		).length;
		return text.artifacts.subline(count?.current ?? 0, count?.total ?? 0, donated, farmLabel);
	}
	if (tab === "minerals") {
		const donated = Object.values(playthrough.data.minerals).filter(
			(entry) => entry.found && entry.donated
		).length;
		return text.minerals.subline(count?.current ?? 0, count?.total ?? 0, donated, farmLabel);
	}
	if (tab === "cooking") {
		const summary = cookingSummary(playthrough.data);
		return text.cooking.subline(
			summary.cooked.current,
			summary.cooked.total,
			summary.learned,
			farmLabel
		);
	}
	if (tab === "crafting") {
		const summary = craftingSummary(playthrough.data);
		return text.crafting.subline(
			summary.crafted.current,
			summary.crafted.total,
			summary.learned,
			farmLabel
		);
	}
	if ((tab === "crops" || tab === "forageables") && count) {
		return text[tab].subline(count.current, count.total, farmLabel);
	}
	if (tab === "animal-products" && count) {
		return text.animalProducts.subline(count.current, count.total, farmLabel);
	}
	if (tab === "artisan-goods" && count) {
		return text.artisanGoods.subline(count.current, count.total, farmLabel);
	}
	if (tab === "monster-loot" && count) {
		return text.monsterLoot.subline(count.current, count.total, farmLabel);
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
