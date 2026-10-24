import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Quests",
	description: "Track your Stardew Valley quests, special orders, secret notes and lost books.",
	alternates: {
		canonical: "/quests",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const QuestsLayout = ({ children }: { children: React.ReactNode }) => children;

export default QuestsLayout;
