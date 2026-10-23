import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Forageables",
	description: "Track your Stardew Valley forageables collection.",
	alternates: {
		canonical: "/collections/forageables",
	},
	openGraph: {
		title: "Forageables | Stardew Valley Companion",
		description: "Track your Stardew Valley forageables collection.",
		url: "/collections/forageables",
	},
};

const ForageablesLayout = ({ children }: { children: React.ReactNode }) => children;

export default ForageablesLayout;
