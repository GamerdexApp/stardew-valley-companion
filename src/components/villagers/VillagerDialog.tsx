import type { Villager } from "stardew-valley-data";
import type { HeartEvent } from "@/types";
import type { GameData } from "@/types/app";
import { villagersText } from "@/lib/messages/villagers";
import { assetPath } from "@/lib/utils/assetPath";
import { capitalize } from "@/lib/utils/formatting";
import {
	isMarried,
	isMaxed,
	maxHeartsOf,
	maxPointsOf,
	pointsToNextHeart,
	progressOf,
	statusOf,
} from "@/service/villagers";
import type { RelationshipStatus } from "@/service/villagers";
import { Badge } from "@/comps/ui/Badge";
import { Dialog } from "@/comps/ui/Dialog";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { ValueStepper } from "@/comps/ui/ValueStepper";
import { GiftPreferencesPanel } from "./GiftPreferencesPanel";
import { HeartEventsPanel } from "./HeartEventsPanel";
import { HeartsRow } from "./HeartsRow";
import { StatusSelect } from "./StatusSelect";

const text = villagersText.dialog;
const cardText = villagersText.card;

interface VillagerDialogProps {
	villager: Villager;
	data: GameData;
	onClose: () => void;
	onHearts: (hearts: number) => void;
	onStatus: (status: RelationshipStatus) => void;
	onEvent: (event: HeartEvent, seen: boolean) => void;
	onTrack: (itemName: string, preference: "loves" | "likes", tracked: boolean) => void;
}

function Fact({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-0.5">
			<SectionLabel className="text-muted">{label}</SectionLabel>
			<span className="text-sm font-medium">{value}</span>
		</div>
	);
}

export function VillagerDialog({
	villager,
	data,
	onClose,
	onHearts,
	onStatus,
	onEvent,
	onTrack,
}: VillagerDialogProps) {
	const { hearts, heartPoints } = progressOf(data, villager.name);
	const maxHearts = maxHeartsOf(data, villager);
	const maxed = isMaxed(data, villager);
	const status = statusOf(data, villager);
	const portrait =
		isMarried(data, villager) && villager.spouseImage ? villager.spouseImage : villager.image;
	const maxPoints = maxPointsOf(data, villager);
	const noteForStatus = status === "none" ? undefined : text.statusNote[status];

	return (
		<Dialog
			open
			onClose={onClose}
			variant="widest"
			title={villager.name}
			description={`${villager.occupation} · ${villager.address}`}
		>
			<div className="flex flex-col gap-4 sm:flex-row">
				<img
					src={assetPath(portrait)}
					alt=""
					width={96}
					height={96}
					className="size-24 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-3">
					<div className="flex flex-wrap items-center gap-x-6 gap-y-2">
						<Fact
							label={text.birthday}
							value={cardText.birthday(
								capitalize(villager.birthday.season),
								villager.birthday.day
							)}
						/>
						<Fact label={text.address} value={villager.address} />
						<Fact label={text.occupation} value={villager.occupation} />
						{status !== "none" && (
							<Badge tone={status === "married" ? "added" : "changed"}>
								{villagersText.status[status]}
							</Badge>
						)}
					</div>
					<div className="flex flex-col gap-1.5">
						<HeartsRow hearts={hearts} max={maxHearts} />
						<div className="flex flex-wrap items-center gap-3">
							<ValueStepper
								label={cardText.hearts(villager.name)}
								value={hearts}
								min={0}
								max={maxHearts}
								onChange={onHearts}
							/>
							<span className="text-muted font-mono text-xs">
								{cardText.heartsOf(hearts, maxHearts)}
							</span>
						</div>
						<div className="flex items-center justify-between gap-3 text-xs">
							<span className="text-muted">{text.points}</span>
							<span className="font-mono">
								{cardText.points(heartPoints, maxPoints)}
							</span>
						</div>
						<ProgressBar
							value={maxPoints > 0 ? heartPoints / maxPoints : 0}
							label={text.points}
							tone={maxed ? "kept" : "primary"}
						/>
						<span className="text-muted text-xs">
							{maxed ? text.noMore : cardText.next(pointsToNextHeart(heartPoints))}
						</span>
					</div>
					<div className="max-w-xs">
						<StatusSelect villager={villager} data={data} onChange={onStatus} />
					</div>
					{noteForStatus && <p className="text-muted text-xs">{noteForStatus}</p>}
					<p className="text-muted text-sm">{villager.description}</p>
				</div>
			</div>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<HeartEventsPanel villager={villager} data={data} onToggle={onEvent} />
				<GiftPreferencesPanel villager={villager} data={data} onTrack={onTrack} />
			</div>
		</Dialog>
	);
}
