import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Cooking Recipes",
	description: "Track your Stardew Valley cooking recipe collection.",
	alternates: {
		canonical: "/collections/cooking",
	},
	openGraph: {
		title: "Cooking Recipes | Stardew Valley Companion",
		description: "Track your Stardew Valley cooking recipe collection.",
		url: "/collections/cooking",
	},
};

const CookingLayout = ({ children }: { children: React.ReactNode }) => children;

export default CookingLayout;
