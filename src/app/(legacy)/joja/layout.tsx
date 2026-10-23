import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "JojaMart",
	description: "Track your Stardew Valley JojaMart membership and community development route.",
	alternates: {
		canonical: "/joja",
	},
	openGraph: {
		title: "JojaMart | Stardew Valley Companion",
		description: "Track your Stardew Valley JojaMart membership and community development route.",
		url: "/joja",
	},
};

const JojaLayout = ({ children }: { children: React.ReactNode }) => children;

export default JojaLayout;
