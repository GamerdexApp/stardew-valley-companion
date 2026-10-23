import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Animal Products",
	description: "Track your Stardew Valley animal products collection.",
	alternates: {
		canonical: "/collections/animal-products",
	},
	openGraph: {
		title: "Animal Products | Stardew Valley Companion",
		description: "Track your Stardew Valley animal products collection.",
		url: "/collections/animal-products",
	},
};

const AnimalProductsLayout = ({ children }: { children: React.ReactNode }) => children;

export default AnimalProductsLayout;
