import { calendarText } from "@/lib/messages/calendar";
import { assetPath } from "@/lib/utils/assetPath";
import { eventCount, eventLines, hasEvents, WEEKDAYS } from "@/service/calendar";
import type { DayEvents } from "@/service/calendar";

const text = calendarText.grid;

interface CalendarGridProps {
	season: string;
	seasonName: string;
	days: DayEvents[];
	today: number | null;
	selected: number | null;
	onSelect: (day: number) => void;
}

export function CalendarGrid({
	season,
	seasonName,
	days,
	today,
	selected,
	onSelect,
}: CalendarGridProps) {
	return (
		<div
			role="group"
			aria-label={text.label(seasonName)}
			data-season={season}
			className="flex flex-col gap-1"
		>
			<div className="text-muted grid grid-cols-7 gap-1 text-center font-mono text-xs uppercase">
				{WEEKDAYS.map((weekday) => (
					<span key={weekday}>{weekday}</span>
				))}
			</div>
			<div className="grid grid-cols-7 gap-1">
				{days.map((day) => {
					const active = hasEvents(day);
					const isToday = day.day === today;
					const lines = eventLines(day);
					const content = (
						<>
							<span
								className={`flex size-6 items-center justify-center rounded-full font-mono text-xs ${
									isToday ? "bg-primary text-on-primary" : ""
								}`}
							>
								{day.day}
							</span>
							<span className="hidden w-full flex-col gap-0.5 md:flex">
								{lines.slice(0, 3).map((line) => (
									<span
										key={`${line.kind}-${line.text}`}
										className="flex min-w-0 items-center gap-1 text-[11px] leading-tight"
									>
										<img
											src={assetPath(line.icon)}
											alt=""
											width={14}
											height={14}
											className="size-3.5 shrink-0 object-contain [image-rendering:pixelated]"
										/>
										<span className="text-ink truncate">{line.text}</span>
									</span>
								))}
								{lines.length > 3 && (
									<span className="text-muted text-[11px]">
										+{lines.length - 3}
									</span>
								)}
							</span>
							<span className="flex flex-wrap gap-0.5 md:hidden" aria-hidden="true">
								{lines.slice(0, 3).map((line) => (
									<img
										key={`${line.kind}-${line.text}`}
										src={assetPath(line.icon)}
										alt=""
										width={12}
										height={12}
										className="size-3 object-contain [image-rendering:pixelated]"
									/>
								))}
							</span>
						</>
					);
					const classes = `flex min-h-14 flex-col items-start gap-1 rounded-md border-[1.5px] p-1 text-start md:min-h-24 md:p-1.5 ${
						day.day === selected
							? "bg-tint border-link"
							: isToday
								? "border-primary bg-surface"
								: "border-line bg-surface"
					}`;
					return active ? (
						<button
							key={day.day}
							type="button"
							aria-label={`${text.cell(seasonName, day.day, eventCount(day))}${isToday ? `, ${text.today}` : ""}`}
							aria-pressed={day.day === selected}
							onClick={() => onSelect(day.day)}
							className={`${classes} cursor-pointer`}
						>
							{content}
						</button>
					) : (
						<div
							key={day.day}
							role="img"
							aria-label={`${text.cell(seasonName, day.day, 0)}${isToday ? `, ${text.today}` : ""}`}
							className={`${classes} opacity-80`}
						>
							{content}
						</div>
					);
				})}
			</div>
		</div>
	);
}
