import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Perfection Tracker",
	description: "Track your progress toward 100% perfection in Stardew Valley.",
	alternates: {
		canonical: "/perfection",
	},
	openGraph: {
		title: "Perfection Tracker | Stardew Valley Companion",
		description: "Track your progress toward 100% perfection in Stardew Valley.",
		url: "/perfection",
	},
};

const PerfectionLayout = ({ children }: { children: React.ReactNode }) => children;

export default PerfectionLayout;
