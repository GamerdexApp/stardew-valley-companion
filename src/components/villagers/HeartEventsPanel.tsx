import type { Villager } from "stardew-valley-data";
import type { HeartEvent } from "@/types";
import type { GameData } from "@/types/app";
import { villagersText } from "@/lib/messages/villagers";
import { eventCountOf, isEventSeen, isTrackableEvent, progressOf } from "@/service/villagers";
import { Badge } from "@/comps/ui/Badge";
import { ExpandableDetails } from "@/comps/ui/ExpandableDetails";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Switch } from "@/comps/ui/Switch";

const text = villagersText.dialog.events;

interface HeartEventsPanelProps {
	villager: Villager;
	data: GameData;
	onToggle: (event: HeartEvent, seen: boolean) => void;
}

export function HeartEventsPanel({ villager, data, onToggle }: HeartEventsPanelProps) {
	const { hearts, eventsSeen } = progressOf(data, villager.name);
	const { seen, total } = eventCountOf(data, villager);

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<h3 className="font-semibold">{text.title}</h3>
				<span className="text-muted font-mono text-xs">{text.count(seen, total)}</span>
			</div>
			{villager.events.length === 0 && <p className="text-muted text-sm">{text.none}</p>}
			<ul className="flex flex-col gap-2">
				{villager.events.map((event) => {
					const done = isEventSeen(event, eventsSeen, hearts);
					const editable = isTrackableEvent(event);
					return (
						<li
							key={`${event.heart}-${event.description}`}
							className={`flex flex-col gap-2 rounded-md border-[1.5px] p-3 ${done ? "border-kept" : "border-line"}`}
						>
							<div className="flex items-start gap-3">
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<SectionLabel className="text-muted">
										{text.heart(event.heart)}
									</SectionLabel>
									<p className="text-sm">{event.description}</p>
								</div>
								{editable ? (
									<Switch
										checked={done}
										onChange={(checked) => onToggle(event, checked)}
										label={text.switch(event.description)}
									/>
								) : (
									<Badge tone={done ? "kept" : "locked"}>
										{done ? text.complete : text.notComplete}
									</Badge>
								)}
							</div>
							{!editable && <p className="text-muted text-xs">{text.derived}</p>}
							{editable && (
								<Badge tone={done ? "kept" : "locked"}>
									{done ? text.seen : text.notSeen}
								</Badge>
							)}
							<ExpandableDetails
								showLabel={text.showDetails}
								hideLabel={text.hideDetails}
							>
								<p className="text-muted text-sm">{event.details}</p>
							</ExpandableDetails>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
