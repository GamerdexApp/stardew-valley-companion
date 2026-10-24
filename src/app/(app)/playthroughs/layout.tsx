import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "My playthroughs",
	description: "Manage your Stardew Valley Companion playthroughs.",
	alternates: {
		canonical: "/playthroughs",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const PlaythroughsLayout = ({ children }: { children: React.ReactNode }) => children;

export default PlaythroughsLayout;
