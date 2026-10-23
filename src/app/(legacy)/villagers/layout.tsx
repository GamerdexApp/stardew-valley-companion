import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Villagers",
	description: "Track your Stardew Valley villager friendships and gift preferences.",
	alternates: {
		canonical: "/villagers",
	},
	openGraph: {
		title: "Villagers | Stardew Valley Companion",
		description: "Track your Stardew Valley villager friendships and gift preferences.",
		url: "/villagers",
	},
};

const VillagersLayout = ({ children }: { children: React.ReactNode }) => children;

export default VillagersLayout;
