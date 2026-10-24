import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Community Center",
	description: "Track your Stardew Valley Community Center bundles or Joja development projects.",
	alternates: {
		canonical: "/community-center",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const CommunityCenterLayout = ({ children }: { children: React.ReactNode }) => children;

export default CommunityCenterLayout;
