import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Mines",
	description: "Track your Stardew Valley mine and Skull Cavern progress.",
	alternates: {
		canonical: "/mines",
	},
	openGraph: {
		title: "Mines | Stardew Valley Companion",
		description: "Track your Stardew Valley mine and Skull Cavern progress.",
		url: "/mines",
	},
};

const MinesLayout = ({ children }: { children: React.ReactNode }) => children;

export default MinesLayout;
