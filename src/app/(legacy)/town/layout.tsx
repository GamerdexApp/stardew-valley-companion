import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Town",
	description: "Track your Stardew Valley town progress and friendships.",
	alternates: {
		canonical: "/town",
	},
	openGraph: {
		title: "Town | Stardew Valley Companion",
		description: "Track your Stardew Valley town progress and friendships.",
		url: "/town",
	},
};

const TownLayout = ({ children }: { children: React.ReactNode }) => children;

export default TownLayout;
