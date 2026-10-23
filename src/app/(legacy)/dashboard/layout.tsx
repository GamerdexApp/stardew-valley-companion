import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Dashboard",
	description: "View your Stardew Valley farm progress at a glance.",
	alternates: {
		canonical: "/dashboard",
	},
	openGraph: {
		title: "Dashboard | Stardew Valley Companion",
		description: "View your Stardew Valley farm progress at a glance.",
		url: "/dashboard",
	},
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => children;

export default DashboardLayout;
