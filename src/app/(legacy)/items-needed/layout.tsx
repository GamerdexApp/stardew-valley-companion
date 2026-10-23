import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Items Needed",
	description: "See what items you still need to complete your Stardew Valley collections and bundles.",
	alternates: {
		canonical: "/items-needed",
	},
	openGraph: {
		title: "Items Needed | Stardew Valley Companion",
		description: "See what items you still need to complete your Stardew Valley collections and bundles.",
		url: "/items-needed",
	},
};

const ItemsNeededLayout = ({ children }: { children: React.ReactNode }) => children;

export default ItemsNeededLayout;
