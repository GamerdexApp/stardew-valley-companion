import type { Villager } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { villagersText } from "@/lib/messages/villagers";
import { assetPath } from "@/lib/utils/assetPath";
import { capitalize } from "@/lib/utils/formatting";
import {
	eventCountOf,
	isMarried,
	isMaxed,
	maxHeartsOf,
	maxPointsOf,
	pointsToNextHeart,
	progressOf,
} from "@/service/villagers";
import type { RelationshipStatus } from "@/service/villagers";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { HeartsRow } from "./HeartsRow";
import { StatusSelect } from "./StatusSelect";

const text = villagersText.card;

interface VillagerCardProps {
	villager: Villager;
	data: GameData;
	onHearts: (hearts: number) => void;
	onStatus: (status: RelationshipStatus) => void;
	onOpen: () => void;
}

export function VillagerCard({ villager, data, onHearts, onStatus, onOpen }: VillagerCardProps) {
	const { hearts, heartPoints } = progressOf(data, villager.name);
	const maxHearts = maxHeartsOf(data, villager);
	const maxed = isMaxed(data, villager);
	const events = eventCountOf(data, villager);
	const portrait =
		isMarried(data, villager) && villager.spouseImage ? villager.spouseImage : villager.image;

	return (
		<Card className={`flex flex-col gap-3 p-3 ${maxed ? "border-kept" : ""}`}>
			<div className="flex items-start gap-3">
				<img
					loading="lazy"
					decoding="async"
					src={assetPath(portrait)}
					alt=""
					width={48}
					height={48}
					className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-0.5 break-words">
					<span className="font-semibold">{villager.name}</span>
					<span className="text-muted text-xs">{villager.occupation}</span>
					<span className="text-muted text-xs">
						{text.birthdayLabel}{" "}
						{text.birthday(capitalize(villager.birthday.season), villager.birthday.day)}
					</span>
				</div>
				{villager.marriageable && <Badge tone="added">{text.canMarry}</Badge>}
			</div>
			<div className="flex flex-col gap-1.5">
				<HeartsRow hearts={hearts} max={maxHearts} />
				<div className="flex flex-wrap items-center justify-between gap-2">
					<ValueStepper
						label={text.hearts(villager.name)}
						value={hearts}
						min={0}
						max={maxHearts}
						onChange={onHearts}
					/>
					<span className="text-muted font-mono text-xs">
						{text.heartsOf(hearts, maxHearts)}
					</span>
				</div>
				<span className="text-muted font-mono text-xs">
					{text.points(heartPoints, maxPointsOf(data, villager))}
					{maxed ? ` · ${text.maxed}` : ` · ${text.next(pointsToNextHeart(heartPoints))}`}
				</span>
			</div>
			{events.total > 0 && (
				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-between text-xs">
						<span className="text-muted">{text.events}</span>
						<span className="font-mono">
							{text.eventsOf(events.seen, events.total)}
						</span>
					</div>
					<ProgressBar
						value={events.seen / events.total}
						label={text.eventsBar(villager.name)}
						tone={events.seen === events.total ? "kept" : "primary"}
					/>
				</div>
			)}
			<StatusSelect villager={villager} data={data} onChange={onStatus} />
			<Button
				variant="secondary"
				aria-label={text.open(villager.name)}
				onClick={onOpen}
				aria-haspopup="dialog"
			>
				{text.details}
			</Button>
		</Card>
	);
}
