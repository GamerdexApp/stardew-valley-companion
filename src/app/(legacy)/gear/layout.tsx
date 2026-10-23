import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Gear",
	description: "Track your Stardew Valley tools and gear upgrades.",
	alternates: {
		canonical: "/gear",
	},
	openGraph: {
		title: "Gear | Stardew Valley Companion",
		description: "Track your Stardew Valley tools and gear upgrades.",
		url: "/gear",
	},
};

const GearLayout = ({ children }: { children: React.ReactNode }) => children;

export default GearLayout;
