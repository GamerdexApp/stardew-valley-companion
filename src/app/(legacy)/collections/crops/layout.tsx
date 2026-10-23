import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Crops",
	description: "Track your Stardew Valley crops collection.",
	alternates: {
		canonical: "/collections/crops",
	},
	openGraph: {
		title: "Crops | Stardew Valley Companion",
		description: "Track your Stardew Valley crops collection.",
		url: "/collections/crops",
	},
};

const CropsLayout = ({ children }: { children: React.ReactNode }) => children;

export default CropsLayout;
