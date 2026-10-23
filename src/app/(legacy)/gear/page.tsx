"use client";

import { TabItem, Tabs } from "flowbite-react";
import { tabTitle } from "@/lib/utils/tabTitle";
import { GEAR_COUNTS } from "@/data/constants/gear";
import { GearHero } from "@/comps/gear/GearHero";
import {
	BaitTab,
	FootwearTab,
	HatsTab,
	RingsTab,
	TackleTab,
	TrinketsTab,
	WeaponsTab,
} from "@/comps/gear/tabs";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function GearPage() {
	return (
		<div className="p-6">
			<PageHeader
				title="Gear"
				description="Weapons, footwear, rings, hats, trinkets, bait, and tackle"
			/>

			<div className="flex flex-col gap-6">
				<GearHero />

				<Tabs variant="underline">
					<TabItem title={tabTitle(`Weapons (${GEAR_COUNTS.weapons})`)}>
						<WeaponsTab />
					</TabItem>
					<TabItem title={tabTitle(`Footwear (${GEAR_COUNTS.footwear})`)}>
						<FootwearTab />
					</TabItem>
					<TabItem title={tabTitle(`Rings (${GEAR_COUNTS.rings})`)}>
						<RingsTab />
					</TabItem>
					<TabItem title={tabTitle(`Hats (${GEAR_COUNTS.hats})`)}>
						<HatsTab />
					</TabItem>
					<TabItem title={tabTitle(`Trinkets (${GEAR_COUNTS.trinkets})`)}>
						<TrinketsTab />
					</TabItem>
					<TabItem title={tabTitle(`Bait (${GEAR_COUNTS.bait})`)}>
						<BaitTab />
					</TabItem>
					<TabItem title={tabTitle(`Tackle (${GEAR_COUNTS.tackle})`)}>
						<TackleTab />
					</TabItem>
				</Tabs>
			</div>
		</div>
	);
}
