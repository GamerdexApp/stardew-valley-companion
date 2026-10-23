import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Community Center",
	description: "Track your Stardew Valley Community Center bundle progress.",
	alternates: {
		canonical: "/community-center",
	},
	openGraph: {
		title: "Community Center | Stardew Valley Companion",
		description: "Track your Stardew Valley Community Center bundle progress.",
		url: "/community-center",
	},
};

const CommunityCenterLayout = ({ children }: { children: React.ReactNode }) => children;

export default CommunityCenterLayout;
