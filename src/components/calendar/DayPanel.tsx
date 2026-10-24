import Link from "next/link";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { calendarText } from "@/lib/messages/calendar";
import { assetPath } from "@/lib/utils/assetPath";
import { BOOKSELLER_IMAGE, giftIdeas, neighbourDays } from "@/service/calendar";
import type { DayEvents } from "@/service/calendar";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const text = calendarText.panel;

interface DayPanelProps {
	seasonName: string;
	days: DayEvents[];
	visibleDays: DayEvents[];
	day: DayEvents | null;
	relation: "today" | "tomorrow" | null;
	bookseller: number[];
	onSelect: (day: number) => void;
}

function Step({
	label,
	season,
	day,
	previous,
	onSelect,
}: {
	label: string;
	season: string;
	day: number | null;
	previous: boolean;
	onSelect: (day: number) => void;
}) {
	if (day === null) return <span className="min-h-11 min-w-11" />;
	return (
		<button
			type="button"
			aria-label={`${label}, ${season} ${day}`}
			onClick={() => onSelect(day)}
			className="text-link flex min-h-11 items-center gap-1 text-sm font-semibold lg:min-h-9"
		>
			{previous && <LuChevronLeft size={16} aria-hidden="true" />}
			{season} {day}
			{!previous && <LuChevronRight size={16} aria-hidden="true" />}
		</button>
	);
}

export function DayPanel({
	seasonName,
	days,
	visibleDays,
	day,
	relation,
	bookseller,
	onSelect,
}: DayPanelProps) {
	if (!day) {
		return (
			<Card className="p-4">
				<p className="text-muted text-sm">{text.empty}</p>
			</Card>
		);
	}
	const { previous, next } = neighbourDays(visibleDays, day.day);
	const source = days[day.day - 1];

	return (
		<Card
			className="flex flex-col gap-4 p-4"
			role="region"
			aria-label={text.title(seasonName, day.day)}
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<h2 className="text-lg font-semibold">{text.title(seasonName, day.day)}</h2>
					{relation && (
						<Badge tone="kept">
							{relation === "today" ? text.today : text.tomorrow}
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-3">
					<Step
						label={text.previousLabel}
						season={seasonName}
						day={previous}
						previous
						onSelect={onSelect}
					/>
					<Step
						label={text.nextLabel}
						season={seasonName}
						day={next}
						previous={false}
						onSelect={onSelect}
					/>
				</div>
			</div>
			<section className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{text.birthdays}</SectionLabel>
				{day.birthdays.length === 0 && <p className="text-muted text-sm">-</p>}
				{day.birthdays.map(({ villager }) => {
					const ideas = giftIdeas(villager);
					return (
						<div
							key={villager.id}
							className="border-line flex flex-col gap-2 rounded-md border-[1.5px] p-3"
						>
							<div className="flex items-center gap-3">
								<img
									src={assetPath(villager.image)}
									alt=""
									width={32}
									height={32}
									className="size-8 shrink-0 object-contain [image-rendering:pixelated]"
								/>
								<span className="min-w-0 flex-1 font-medium">
									{text.birthday(villager.name)}
								</span>
								<Link
									href="/villagers"
									className="text-link flex min-h-11 items-center text-sm font-semibold underline-offset-2 hover:underline lg:min-h-6"
								>
									{text.open(villager.name)}
								</Link>
							</div>
							<span className="text-muted text-xs">{text.giftIdeasPlain}</span>
							<ul className="flex flex-wrap gap-1.5">
								{ideas.loved.map((name) => (
									<li
										key={`l-${name}`}
										className="border-line rounded-md border-[1.5px] px-2 py-0.5 text-sm"
									>
										{name}{" "}
										<span className="text-danger text-xs">{text.loved}</span>
									</li>
								))}
								{ideas.liked.map((name) => (
									<li
										key={`k-${name}`}
										className="border-line rounded-md border-[1.5px] px-2 py-0.5 text-sm"
									>
										{name}{" "}
										<span className="text-kept text-xs">{text.liked}</span>
									</li>
								))}
							</ul>
						</div>
					);
				})}
			</section>
			<section className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{text.festivals}</SectionLabel>
				{day.festivals.length === 0 && (
					<p className="text-muted text-sm">{text.noFestival}</p>
				)}
				{day.festivals.map((festival) => (
					<div
						key={festival.name}
						className="border-line flex items-center gap-3 rounded-md border-[1.5px] p-3"
					>
						<img
							src={assetPath(festival.icon)}
							alt=""
							width={28}
							height={28}
							className="size-7 shrink-0 object-contain [image-rendering:pixelated]"
						/>
						<span className="min-w-0 flex-1 font-medium">{festival.name}</span>
						{festival.totalDays > 1 && (
							<span className="text-muted font-mono text-xs">
								{text.festivalDay(festival.dayOfFestival, festival.totalDays)}
							</span>
						)}
					</div>
				))}
			</section>
			<section className="flex flex-col gap-2">
				<SectionLabel className="text-muted">{text.bookseller}</SectionLabel>
				<div className="flex items-start gap-3">
					<img
						src={assetPath(BOOKSELLER_IMAGE)}
						alt=""
						width={24}
						height={24}
						className="size-6 shrink-0 object-contain [image-rendering:pixelated]"
					/>
					<div className="flex flex-col gap-0.5 text-sm">
						<span>{source.bookseller ? text.bookSellerYes : text.bookSellerNo}</span>
						{!source.bookseller && bookseller.length > 0 && (
							<span className="text-muted">
								{text.maySeeOn(seasonName, bookseller)}
							</span>
						)}
					</div>
				</div>
			</section>
		</Card>
	);
}
