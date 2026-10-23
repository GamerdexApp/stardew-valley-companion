import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Playthroughs",
	description: "View and manage all of your Stardew Valley playthroughs.",
	alternates: {
		canonical: "/playthrough/list",
	},
	openGraph: {
		title: "Playthroughs | Stardew Valley Companion",
		description: "View and manage all of your Stardew Valley playthroughs.",
		url: "/playthrough/list",
	},
};

const PlaythroughListLayout = ({ children }: { children: React.ReactNode }) => children;

export default PlaythroughListLayout;
