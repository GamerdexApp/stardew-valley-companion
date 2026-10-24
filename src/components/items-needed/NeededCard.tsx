import { useState } from "react";
import { LuGift } from "react-icons/lu";
import { itemsNeededText } from "@/lib/messages/itemsNeeded";
import { totalQuantity, villagerLabel } from "@/service/itemsNeeded";
import type { NeededItem, NeededItemUsage, NeededTag } from "@/service/itemsNeeded";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";

const text = itemsNeededText.card;

const tagTones = {
	Donate: "fixed",
	Ship: "kept",
	Cook: "warn",
	Craft: "changed",
	Build: "locked",
	Bundle: "added",
	Gift: "warn",
} as const satisfies Record<NeededTag, string>;

interface NeededCardProps {
	item: NeededItem;
	onGifted: (villager: string, itemName: string) => void;
	onUntrack: (villager: string, itemName: string) => void;
}

function UsageLine({
	item,
	usage,
	onGifted,
	onUntrack,
}: { item: NeededItem; usage: NeededItemUsage } & Omit<NeededCardProps, "item">) {
	const goal = usage.villager
		? `${villagerLabel(usage.villager)} (${text.preference[usage.preference ?? "likes"]})`
		: text.forGoal(usage.goalName, usage.quantity);

	return (
		<li className="flex flex-col gap-1">
			<div className="flex flex-wrap items-center gap-2">
				<Badge tone={tagTones[usage.tag]}>{itemsNeededText.tags[usage.tag]}</Badge>
				{(usage.tag !== "Donate" && usage.tag !== "Ship") || usage.villager ? (
					<span className="text-sm">{goal}</span>
				) : (
					<span className="text-muted text-sm">{usage.goalName}</span>
				)}
			</div>
			{usage.villager && (
				<div className="flex flex-wrap gap-2">
					<Button
						variant="secondary"
						aria-label={text.markLabel(item.name, villagerLabel(usage.villager))}
						onClick={() => onGifted(usage.villager!, item.name)}
					>
						{text.markGifted}
					</Button>
					<Button
						variant="secondary"
						aria-label={text.untrackLabel(item.name, villagerLabel(usage.villager))}
						onClick={() => onUntrack(usage.villager!, item.name)}
					>
						{text.untrack}
					</Button>
				</div>
			)}
		</li>
	);
}

export function NeededCard({ item, onGifted, onUntrack }: NeededCardProps) {
	const [broken, setBroken] = useState(false);
	const quantity = totalQuantity(item);

	return (
		<Card className="flex flex-col gap-2 p-3">
			<div className="flex items-start gap-3">
				{item.image && !broken ? (
					<img
						src={item.image}
						alt=""
						width={32}
						height={32}
						onError={() => setBroken(true)}
						className="size-8 shrink-0 object-contain [image-rendering:pixelated]"
					/>
				) : (
					<LuGift size={28} aria-hidden="true" className="text-muted shrink-0" />
				)}
				<span className="min-w-0 flex-1 font-semibold">{item.name}</span>
				{quantity > 0 && (
					<span className="font-mono text-sm font-medium">{text.quantity(quantity)}</span>
				)}
			</div>
			<ul className="flex flex-col gap-2">
				{item.usages.map((usage, index) => (
					<UsageLine
						key={`${usage.tag}-${usage.goalName}-${index}`}
						item={item}
						usage={usage}
						onGifted={onGifted}
						onUntrack={onUntrack}
					/>
				))}
			</ul>
		</Card>
	);
}
