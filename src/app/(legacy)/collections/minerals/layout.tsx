import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Minerals",
	description: "Track your Stardew Valley minerals collection.",
	alternates: {
		canonical: "/collections/minerals",
	},
	openGraph: {
		title: "Minerals | Stardew Valley Companion",
		description: "Track your Stardew Valley minerals collection.",
		url: "/collections/minerals",
	},
};

const MineralsLayout = ({ children }: { children: React.ReactNode }) => children;

export default MineralsLayout;
