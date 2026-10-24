import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Items needed",
	description: "Everything you still need to complete your Stardew Valley collection goals.",
	alternates: {
		canonical: "/items-needed",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const ItemsNeededLayout = ({ children }: { children: React.ReactNode }) => children;

export default ItemsNeededLayout;
