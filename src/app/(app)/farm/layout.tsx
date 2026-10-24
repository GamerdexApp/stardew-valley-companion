import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Farm",
	description: "Your Stardew Valley farmer, tools, skills, animals, buildings and Ginger Island.",
	alternates: {
		canonical: "/farm",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const FarmLayout = ({ children }: { children: React.ReactNode }) => children;

export default FarmLayout;
