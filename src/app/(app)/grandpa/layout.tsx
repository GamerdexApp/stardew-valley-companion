import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Grandpa's evaluation",
	description: "See how your Stardew Valley farm scores on Grandpa's year 3 evaluation.",
	alternates: {
		canonical: "/grandpa",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const GrandpaLayout = ({ children }: { children: React.ReactNode }) => children;

export default GrandpaLayout;
