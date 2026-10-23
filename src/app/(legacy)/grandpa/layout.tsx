import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Grandpa's Evaluation",
	description: "Track your progress toward Grandpa's farm evaluation in Stardew Valley.",
	alternates: {
		canonical: "/grandpa",
	},
	openGraph: {
		title: "Grandpa's Evaluation | Stardew Valley Companion",
		description: "Track your progress toward Grandpa's farm evaluation in Stardew Valley.",
		url: "/grandpa",
	},
};

const GrandpaLayout = ({ children }: { children: React.ReactNode }) => children;

export default GrandpaLayout;
