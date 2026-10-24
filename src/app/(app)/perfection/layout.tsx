import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Perfection",
	description: "Track your Stardew Valley progress toward 100% perfection.",
	alternates: {
		canonical: "/perfection",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const PerfectionLayout = ({ children }: { children: React.ReactNode }) => children;

export default PerfectionLayout;
