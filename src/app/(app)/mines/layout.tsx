import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Mines and monsters",
	description: "Track your Stardew Valley mine progress, slayer goals and monster kills.",
	alternates: {
		canonical: "/mines",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const MinesLayout = ({ children }: { children: React.ReactNode }) => children;

export default MinesLayout;
