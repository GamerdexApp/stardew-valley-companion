import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Gear",
	description:
		"A reference for Stardew Valley weapons, footwear, rings, hats, trinkets, bait and tackle.",
	alternates: {
		canonical: "/gear",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const GearLayout = ({ children }: { children: React.ReactNode }) => children;

export default GearLayout;
