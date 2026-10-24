import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Villagers",
	description: "Track your Stardew Valley villager friendships and gift preferences.",
	alternates: {
		canonical: "/villagers",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const VillagersLayout = ({ children }: { children: React.ReactNode }) => children;

export default VillagersLayout;
