import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Collections",
	description: "Browse all Stardew Valley collection categories — fish, crops, minerals, artifacts, and more.",
	alternates: {
		canonical: "/collections",
	},
	openGraph: {
		title: "Collections | Stardew Valley Companion",
		description: "Browse all Stardew Valley collection categories — fish, crops, minerals, artifacts, and more.",
		url: "/collections",
	},
};

const CollectionsOverviewLayout = ({ children }: { children: React.ReactNode }) => children;

export default CollectionsOverviewLayout;
