import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Farm Buildings",
	description: "Track your Stardew Valley farm buildings.",
	alternates: {
		canonical: "/farm/buildings",
	},
	openGraph: {
		title: "Farm Buildings | Stardew Valley Companion",
		description: "Track your Stardew Valley farm buildings.",
		url: "/farm/buildings",
	},
};

const FarmBuildingsLayout = ({ children }: { children: React.ReactNode }) => children;

export default FarmBuildingsLayout;
