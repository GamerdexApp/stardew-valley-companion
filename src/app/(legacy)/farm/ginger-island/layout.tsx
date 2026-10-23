import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Ginger Island",
	description: "Track your Stardew Valley Ginger Island progress.",
	alternates: {
		canonical: "/farm/ginger-island",
	},
	openGraph: {
		title: "Ginger Island | Stardew Valley Companion",
		description: "Track your Stardew Valley Ginger Island progress.",
		url: "/farm/ginger-island",
	},
};

const GingerIslandLayout = ({ children }: { children: React.ReactNode }) => children;

export default GingerIslandLayout;
