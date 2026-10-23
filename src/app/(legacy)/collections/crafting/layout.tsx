import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Crafting Recipes",
	description: "Track your Stardew Valley crafting recipe collection.",
	alternates: {
		canonical: "/collections/crafting",
	},
	openGraph: {
		title: "Crafting Recipes | Stardew Valley Companion",
		description: "Track your Stardew Valley crafting recipe collection.",
		url: "/collections/crafting",
	},
};

const CraftingLayout = ({ children }: { children: React.ReactNode }) => children;

export default CraftingLayout;
