import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Monster Loot",
	description: "Track your Stardew Valley monster loot collection.",
	alternates: {
		canonical: "/collections/monster-loot",
	},
	openGraph: {
		title: "Monster Loot | Stardew Valley Companion",
		description: "Track your Stardew Valley monster loot collection.",
		url: "/collections/monster-loot",
	},
};

const MonsterLootLayout = ({ children }: { children: React.ReactNode }) => children;

export default MonsterLootLayout;
