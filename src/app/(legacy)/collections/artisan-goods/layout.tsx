import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Artisan Goods",
	description: "Track your Stardew Valley artisan goods collection.",
	alternates: {
		canonical: "/collections/artisan-goods",
	},
	openGraph: {
		title: "Artisan Goods | Stardew Valley Companion",
		description: "Track your Stardew Valley artisan goods collection.",
		url: "/collections/artisan-goods",
	},
};

const ArtisanGoodsLayout = ({ children }: { children: React.ReactNode }) => children;

export default ArtisanGoodsLayout;
