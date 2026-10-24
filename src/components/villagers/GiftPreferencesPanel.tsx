import type { Villager } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { villagersText } from "@/lib/messages/villagers";
import {
	canTrackGift,
	GIFT_GROUPS,
	giftsFor,
	trackedCountFor,
	trackingOf,
} from "@/service/villagers";
import type { GiftPreference } from "@/service/villagers";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const text = villagersText.dialog.gifts;

interface GiftPreferencesPanelProps {
	villager: Villager;
	data: GameData;
	onTrack: (itemName: string, preference: "loves" | "likes", tracked: boolean) => void;
}

export function GiftPreferencesPanel({ villager, data, onTrack }: GiftPreferencesPanelProps) {
	const trackedCount = trackedCountFor(data, villager.name);

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<h3 className="font-semibold">{text.title}</h3>
				{trackedCount > 0 && (
					<span className="text-kept font-mono text-xs">
						{text.tracked(trackedCount)}
					</span>
				)}
			</div>
			<p className="text-muted text-xs">{text.universalNote}</p>
			{GIFT_GROUPS.map((group) => (
				<GiftGroup
					key={group}
					group={group}
					villager={villager}
					data={data}
					onTrack={onTrack}
				/>
			))}
		</section>
	);
}

function GiftGroup({
	group,
	villager,
	data,
	onTrack,
}: GiftPreferencesPanelProps & { group: GiftPreference }) {
	const gifts = giftsFor(villager, group);
	const hasPersonal = gifts.some((gift) => !gift.universal);

	return (
		<div className="flex flex-col gap-1.5">
			<SectionLabel className="text-muted">
				{text.groups[group]} ({gifts.length})
			</SectionLabel>
			{!hasPersonal && <p className="text-muted text-xs">{text.none[group]}</p>}
			<ul className="flex flex-wrap gap-1.5">
				{gifts.map((gift) => {
					const trackable = canTrackGift(group, gift.name);
					const state = trackingOf(data, villager.name, gift.name);
					return (
						<li
							key={`${gift.universal ? "u" : "p"}-${gift.name}`}
							className="border-line flex items-center gap-1.5 rounded-md border-[1.5px] ps-2 text-sm"
						>
							<span className="py-1">{gift.name}</span>
							{gift.universal && (
								<span className="text-muted font-mono text-[11px] uppercase">
									{text.universal}
								</span>
							)}
							{trackable && state === "given" && (
								<span className="text-kept px-2 text-xs font-medium">
									{text.given}
								</span>
							)}
							{trackable && state !== "given" && (
								<button
									type="button"
									aria-pressed={state === "tracked"}
									aria-label={
										state === "tracked"
											? text.untrackLabel(gift.name, villager.name)
											: text.trackLabel(gift.name, villager.name)
									}
									onClick={() =>
										onTrack(
											gift.name,
											group as "loves" | "likes",
											state !== "tracked"
										)
									}
									className={`flex min-h-11 items-center px-2 text-xs font-semibold lg:min-h-8 ${
										state === "tracked" ? "text-kept" : "text-link"
									}`}
								>
									{state === "tracked" ? text.tracking : text.track}
								</button>
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
}
