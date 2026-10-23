import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Fish",
	description: "Track your Stardew Valley fish collection.",
	alternates: {
		canonical: "/collections/fish",
	},
	openGraph: {
		title: "Fish | Stardew Valley Companion",
		description: "Track your Stardew Valley fish collection.",
		url: "/collections/fish",
	},
};

const FishLayout = ({ children }: { children: React.ReactNode }) => children;

export default FishLayout;
