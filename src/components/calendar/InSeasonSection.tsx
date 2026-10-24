import { useState } from "react";
import { calendarText } from "@/lib/messages/calendar";
import type { InSeason } from "@/service/calendar";
import { Section } from "@/comps/ui/Section";

const text = calendarText.inSeason;
const PREVIEW = 9;

function Group({ title, names }: { title: string; names: string[] }) {
	const [all, setAll] = useState(false);
	const shown = all ? names : names.slice(0, PREVIEW);
	const hidden = names.length - shown.length;

	return (
		<div className="flex flex-col gap-2">
			<h3 className="flex items-baseline justify-between gap-2 font-semibold">
				{title}
				<span className="text-muted font-mono text-xs">{names.length}</span>
			</h3>
			<ul className="flex flex-wrap gap-1.5">
				{shown.map((name) => (
					<li
						key={name}
						className="border-line rounded-md border-[1.5px] px-2 py-0.5 text-sm"
					>
						{name}
					</li>
				))}
				{names.length > PREVIEW && (
					<li>
						<button
							type="button"
							onClick={() => setAll(!all)}
							className="text-link border-link flex min-h-11 items-center rounded-md border-[1.5px] px-2 text-sm font-medium lg:min-h-7"
						>
							{all ? text.fewer : text.more(hidden)}
						</button>
					</li>
				)}
			</ul>
		</div>
	);
}

export function InSeasonSection({ seasonName, items }: { seasonName: string; items: InSeason }) {
	return (
		<Section title={text.title(seasonName)} description={text.source}>
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
				<Group title={text.crops} names={items.crops} />
				<Group title={text.forageables} names={items.forageables} />
				<Group title={text.fish} names={items.fish} />
			</div>
			<p className="text-muted text-xs">{text.note}</p>
		</Section>
	);
}
