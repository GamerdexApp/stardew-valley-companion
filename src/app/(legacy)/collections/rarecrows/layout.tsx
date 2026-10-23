import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Rarecrows",
	description: "Track your Stardew Valley rarecrows collection.",
	alternates: {
		canonical: "/collections/rarecrows",
	},
	openGraph: {
		title: "Rarecrows | Stardew Valley Companion",
		description: "Track your Stardew Valley rarecrows collection.",
		url: "/collections/rarecrows",
	},
};

const RarecrowsLayout = ({ children }: { children: React.ReactNode }) => children;

export default RarecrowsLayout;
