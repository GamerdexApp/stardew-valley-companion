"use client";

import { gearText } from "@/lib/messages/gear";
import { kebabToTitle } from "@/lib/utils/formatting";
import { allBait, allFootwear, allHats, allRings, allTackle, allTrinkets } from "@/service/gear";
import { GearCard } from "./GearCard";
import { SimpleTab } from "./SimpleTab";

const text = gearText;

export function FootwearTab() {
	return (
		<SimpleTab
			title={text.tabs.footwear}
			noun="footwear"
			items={allFootwear}
			searchTexts={(item) => [item.description, item.obtain]}
			renderCard={(item) => (
				<GearCard
					key={item.id}
					image={item.image}
					name={item.name}
					stats={[text.stat.defense(item.defense), text.stat.immunity(item.immunity)]}
					lines={[item.description, item.obtain]}
					sellPrice={item.sellPrice}
				/>
			)}
		/>
	);
}

export function RingsTab() {
	return (
		<SimpleTab
			title={text.tabs.rings}
			noun="rings"
			items={allRings}
			searchTexts={(item) => [item.description, ...item.sources]}
			renderCard={(item) => (
				<GearCard
					key={item.id}
					image={item.image}
					name={item.name}
					lines={[item.description]}
					chips={item.sources}
					sellPrice={item.sellPrice}
				/>
			)}
		/>
	);
}

export function HatsTab() {
	return (
		<SimpleTab
			title={text.tabs.hats}
			noun="hats"
			items={allHats}
			searchTexts={(item) => [item.description, item.obtain]}
			renderCard={(item) => (
				<GearCard
					key={item.id}
					image={item.image}
					name={item.name}
					lines={[item.description, item.obtain]}
				/>
			)}
		/>
	);
}

export function TrinketsTab() {
	return (
		<SimpleTab
			title={text.tabs.trinkets}
			noun="trinkets"
			items={allTrinkets}
			searchTexts={(item) => [item.effect, kebabToTitle(item.source)]}
			renderCard={(item) => (
				<GearCard
					key={item.id}
					image={item.image}
					name={item.name}
					lines={[item.effect]}
					chips={[kebabToTitle(item.source)]}
					sellPrice={item.sellPrice}
				/>
			)}
		/>
	);
}

export function BaitTab() {
	return (
		<SimpleTab
			title={text.tabs.bait}
			noun="bait"
			items={allBait}
			searchTexts={(item) => [item.description]}
			renderCard={(item) => (
				<GearCard
					key={item.id}
					image={item.image}
					name={item.name}
					lines={[item.description]}
					sellPrice={item.sellPrice}
				/>
			)}
		/>
	);
}

export function TackleTab() {
	return (
		<SimpleTab
			title={text.tabs.tackle}
			noun="tackle"
			items={allTackle}
			searchTexts={(item) => [item.description]}
			renderCard={(item) => (
				<GearCard
					key={item.id}
					image={item.image}
					name={item.name}
					lines={[item.description]}
					sellPrice={item.sellPrice}
				/>
			)}
		/>
	);
}
