"use client";

import { useState } from "react";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { calendarText } from "@/lib/messages/calendar";
import { assetPath } from "@/lib/utils/assetPath";
import {
	allLayers,
	CALENDAR_LAYERS,
	CALENDAR_SEASONS,
	hasEvents,
	inSeason,
	LAYER_ICONS,
	seasonDays,
	seasonEvents,
	todayOf,
	visibleEvents,
} from "@/service/calendar";
import type { CalendarLayer, CalendarSeason, VisibleLayers } from "@/service/calendar";
import { PageHeader } from "@/comps/shell/PageHeader";
import { Card } from "@/comps/ui/Card";
import { Section } from "@/comps/ui/Section";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { CalendarGrid } from "./CalendarGrid";
import { DayPanel } from "./DayPanel";
import { InSeasonSection } from "./InSeasonSection";

const text = calendarText;

export function CalendarPage() {
	const { activePlaythrough } = usePlaythrough();
	const today = todayOf(activePlaythrough?.data ?? null);
	const [season, setSeason] = useState<CalendarSeason>(today?.season ?? "spring");
	const [layers, setLayers] = useState<VisibleLayers>(allLayers);
	const [chosen, setChosen] = useState<number | null>(null);

	const seasonName = text.seasons[season];
	const days = seasonDays(season);
	const visibleDays = days.map((day) => visibleEvents(day, layers));
	const todayInSeason = today?.season === season ? today.day : null;
	const selected =
		chosen !== null && hasEvents(visibleDays[chosen - 1])
			? chosen
			: todayInSeason && hasEvents(visibleDays[todayInSeason - 1])
				? todayInSeason
				: null;
	const relation =
		selected === null || todayInSeason === null
			? null
			: selected === todayInSeason
				? "today"
				: selected === todayInSeason + 1
					? "tomorrow"
					: null;
	const bookseller = days.filter((day) => day.bookseller).map((day) => day.day);
	const events = seasonEvents(visibleDays);
	const year = activePlaythrough?.data.character.currentDate.year;

	return (
		<>
			<PageHeader
				title={text.title}
				subline={
					today && year !== undefined
						? text.sublineToday(text.seasons[today.season], today.day, year)
						: text.subline
				}
			/>
			<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
				<SegmentedControl
					label={text.seasonLabel}
					value={season}
					onChange={(next) => {
						setSeason(next);
						setChosen(null);
					}}
					options={CALENDAR_SEASONS.map((id) => ({
						id,
						label:
							today?.season === id
								? `${text.seasons[id]} · ${text.now}`
								: text.seasons[id],
					}))}
				/>
				<fieldset className="flex flex-wrap items-center gap-2">
					<legend className="sr-only">{text.layersLabel}</legend>
					<span className="text-muted text-sm" aria-hidden="true">
						{text.layersLabel}
					</span>
					{CALENDAR_LAYERS.map((layer: CalendarLayer) => (
						<button
							key={layer}
							type="button"
							aria-pressed={layers[layer]}
							onClick={() => setLayers({ ...layers, [layer]: !layers[layer] })}
							className={`flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] px-3 text-sm lg:min-h-9 ${
								layers[layer] ? "border-primary bg-tint" : "border-line"
							}`}
						>
							<img
								src={assetPath(LAYER_ICONS[layer])}
								alt=""
								width={18}
								height={18}
								className="size-4.5 object-contain [image-rendering:pixelated]"
							/>
							{text.layers[layer]}
						</button>
					))}
				</fieldset>
			</div>
			<Card className="flex flex-col gap-3 p-3 md:p-4">
				<CalendarGrid
					season={season}
					seasonName={seasonName}
					days={visibleDays}
					today={todayInSeason}
					selected={selected}
					onSelect={setChosen}
				/>
				<p className="text-muted text-xs">
					<span className="md:hidden">{text.grid.hintShort} </span>
					{text.grid.hint}
				</p>
			</Card>
			<DayPanel
				seasonName={seasonName}
				days={days}
				visibleDays={visibleDays}
				day={selected === null ? null : visibleDays[selected - 1]}
				relation={relation}
				bookseller={bookseller}
				onSelect={setChosen}
			/>
			<Section title={text.thisSeason.title} badge={text.thisSeason.badge(events.length)}>
				<ul className="flex flex-col gap-1.5">
					{events.map((event) => (
						<li
							key={`${event.kind}-${event.day}-${event.name}`}
							className="flex items-center gap-2 text-sm"
						>
							<img
								src={assetPath(event.icon)}
								alt=""
								width={20}
								height={20}
								className="size-5 shrink-0 object-contain [image-rendering:pixelated]"
							/>
							<span className="min-w-0 flex-1">{event.name}</span>
							<span className="text-muted font-mono text-xs">
								{text.thisSeason.when(seasonName, event.day)}
							</span>
						</li>
					))}
				</ul>
			</Section>
			<InSeasonSection seasonName={seasonName} items={inSeason(season)} />
		</>
	);
}
