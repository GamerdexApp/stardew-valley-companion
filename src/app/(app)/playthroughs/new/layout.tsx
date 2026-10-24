import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "New playthrough",
	description: "Start a Stardew Valley Companion playthrough from a save file or by hand.",
	alternates: {
		canonical: "/playthroughs/new",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const NewPlaythroughLayout = ({ children }: { children: React.ReactNode }) => children;

export default NewPlaythroughLayout;
