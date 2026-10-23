import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Calendar",
	description: "Track Stardew Valley's yearly calendar, birthdays, and festival dates.",
	alternates: {
		canonical: "/calendar",
	},
	openGraph: {
		title: "Calendar | Stardew Valley Companion",
		description: "Track Stardew Valley's yearly calendar, birthdays, and festival dates.",
		url: "/calendar",
	},
};

const CalendarLayout = ({ children }: { children: React.ReactNode }) => children;

export default CalendarLayout;
