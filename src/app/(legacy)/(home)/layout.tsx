import type { Metadata } from "next";

export const metadata: Metadata = {
	alternates: {
		canonical: "/",
	},
};

const HomeLayout = ({ children }: { children: React.ReactNode }) => children;

export default HomeLayout;
