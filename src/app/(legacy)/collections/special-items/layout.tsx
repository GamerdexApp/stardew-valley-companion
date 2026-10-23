import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Special Items",
	description: "Track your Stardew Valley special items collection.",
	alternates: {
		canonical: "/collections/special-items",
	},
	openGraph: {
		title: "Special Items | Stardew Valley Companion",
		description: "Track your Stardew Valley special items collection.",
		url: "/collections/special-items",
	},
};

const SpecialItemsLayout = ({ children }: { children: React.ReactNode }) => children;

export default SpecialItemsLayout;
