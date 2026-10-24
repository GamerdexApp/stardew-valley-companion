import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Town",
	description: "Locations, shops and hours throughout the Stardew Valley map.",
	alternates: {
		canonical: "/town",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const TownLayout = ({ children }: { children: React.ReactNode }) => children;

export default TownLayout;
