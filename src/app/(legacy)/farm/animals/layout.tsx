import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Farm Animals",
	description: "Track your Stardew Valley farm animals.",
	alternates: {
		canonical: "/farm/animals",
	},
	openGraph: {
		title: "Farm Animals | Stardew Valley Companion",
		description: "Track your Stardew Valley farm animals.",
		url: "/farm/animals",
	},
};

const FarmAnimalsLayout = ({ children }: { children: React.ReactNode }) => children;

export default FarmAnimalsLayout;
