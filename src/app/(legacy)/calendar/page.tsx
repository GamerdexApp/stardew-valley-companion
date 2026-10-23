"use client";

import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { CalendarView } from "@/comps/calendar/CalendarView";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function CalendarPage() {
	const { activePlaythrough } = usePlaythrough();

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="calendar" />;
	}

	return (
		<div className="p-6">
			<PageHeader title="Calendar" description="Birthdays, festivals, and seasonal events" />
			<CalendarView gameData={activePlaythrough.data} />
		</div>
	);
}
