import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Quests",
	description: "Track your Stardew Valley quests and special orders.",
	alternates: {
		canonical: "/quests",
	},
	openGraph: {
		title: "Quests | Stardew Valley Companion",
		description: "Track your Stardew Valley quests and special orders.",
		url: "/quests",
	},
};

const QuestsLayout = ({ children }: { children: React.ReactNode }) => children;

export default QuestsLayout;
