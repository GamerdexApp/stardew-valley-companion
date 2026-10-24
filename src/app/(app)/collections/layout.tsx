import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Collections",
	description: "Track your Stardew Valley fish, artifacts, minerals, recipes, crops and more.",
	alternates: {
		canonical: "/collections",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const CollectionsLayout = ({ children }: { children: React.ReactNode }) => children;

export default CollectionsLayout;
