import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "New Playthrough",
	description: "Start tracking a new Stardew Valley playthrough.",
	alternates: {
		canonical: "/playthrough/new",
	},
	openGraph: {
		title: "New Playthrough | Stardew Valley Companion",
		description: "Start tracking a new Stardew Valley playthrough.",
		url: "/playthrough/new",
	},
};

const PlaythroughNewLayout = ({ children }: { children: React.ReactNode }) => children;

export default PlaythroughNewLayout;
