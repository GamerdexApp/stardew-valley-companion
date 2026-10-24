import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Overview",
	description:
		"Your Stardew Valley progress at a glance: skills, collections, relationships, perfection and more.",
	alternates: {
		canonical: "/overview",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const OverviewLayout = ({ children }: { children: React.ReactNode }) => children;

export default OverviewLayout;
