import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Calendar",
	description: "Stardew Valley birthdays, festivals and seasonal events.",
	alternates: {
		canonical: "/calendar",
	},
	robots: {
		index: false,
		follow: true,
	},
};

const CalendarLayout = ({ children }: { children: React.ReactNode }) => children;

export default CalendarLayout;
