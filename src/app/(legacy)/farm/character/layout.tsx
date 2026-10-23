import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Character",
	description: "Track your Stardew Valley character skills and stats.",
	alternates: {
		canonical: "/farm/character",
	},
	openGraph: {
		title: "Character | Stardew Valley Companion",
		description: "Track your Stardew Valley character skills and stats.",
		url: "/farm/character",
	},
};

const FarmCharacterLayout = ({ children }: { children: React.ReactNode }) => children;

export default FarmCharacterLayout;
