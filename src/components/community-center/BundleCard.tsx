import type { GameData } from "@/types/app";
import { communityCenterText } from "@/lib/messages/communityCenter";
import { assetPath } from "@/lib/utils/assetPath";
import { formatNumber } from "@/lib/utils/formatting";
import {
	handedIn,
	isBundleComplete,
	isGoldBundle,
	isItemHandedIn,
	isRoomLocked,
	itemImage,
	itemsNeeded,
	rooms,
} from "@/service/communityCenter";
import type { CatalogBundle } from "@/service/communityCenter";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";

const text = communityCenterText.bundle;

const qualityImages: Record<string, string> = {
	silver: "images/misc/Silver Quality.png",
	gold: "images/misc/Gold Quality.png",
	iridium: "images/misc/Iridium Quality.png",
};

interface BundleCardProps {
	bundle: CatalogBundle;
	data: GameData;
	onItem: (index: number, done: boolean) => void;
	onAll: (done: boolean) => void;
	/** A control for the slot of a remix bundle, shown above the items. */
	slot?: React.ReactNode;
}

export function BundleCard({ bundle, data, onItem, onAll, slot }: BundleCardProps) {
	const room = rooms.find((item) => item.id === bundle.room);
	const locked = room ? isRoomLocked(data, room) : data.communityCenter.completed;
	const complete = isBundleComplete(data, bundle);
	const done = handedIn(data, bundle);

	return (
		<Card className={`flex flex-col gap-3 p-3 ${complete ? "border-kept" : ""}`}>
			{slot}
			<div className="flex items-start gap-3">
				<img
					loading="lazy"
					decoding="async"
					src={assetPath(bundle.image)}
					alt=""
					width={40}
					height={40}
					className="size-10 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<span className="font-semibold">{bundle.name}</span>
					<span className="text-muted font-mono text-xs">
						{isGoldBundle(bundle)
							? text.gold(done)
							: text.items(Math.min(done, itemsNeeded(bundle)), itemsNeeded(bundle))}
					</span>
				</div>
				<Badge tone={complete ? "kept" : "locked"}>
					{complete ? text.complete : text.incomplete}
				</Badge>
			</div>
			{isGoldBundle(bundle) ? (
				<button
					type="button"
					aria-pressed={isItemHandedIn(data, bundle, 0)}
					disabled={locked}
					onClick={() => onItem(0, !isItemHandedIn(data, bundle, 0))}
					className={`flex min-h-11 items-center justify-between gap-3 rounded-md border-[1.5px] px-3 text-sm disabled:opacity-70 lg:min-h-9 ${
						isItemHandedIn(data, bundle, 0) || locked
							? "border-kept bg-tint"
							: "border-line"
					}`}
				>
					<span>{text.goldRequired(formatNumber(bundle.goldCost))}</span>
					<span className="font-medium">
						{isItemHandedIn(data, bundle, 0) || locked ? text.paid : text.notPaid}
					</span>
				</button>
			) : (
				<>
					{bundle.itemsRequired < bundle.items.length && (
						<p className="text-muted text-xs">
							{text.selectOf(bundle.itemsRequired, bundle.items.length)}
						</p>
					)}
					<ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
						{bundle.items.map((item, index) => {
							const on = isItemHandedIn(data, bundle, index) || locked;
							const image = itemImage(item.name);
							const quality = item.quality ? qualityImages[item.quality] : undefined;
							return (
								<li key={`${item.name}-${index}`}>
									<button
										type="button"
										aria-pressed={on}
										aria-label={text.itemLabel(
											item.quantity > 1
												? `${item.name} ${text.quantity(item.quantity)}`
												: item.name,
											bundle.name
										)}
										disabled={locked}
										onClick={() =>
											onItem(index, !isItemHandedIn(data, bundle, index))
										}
										className={`flex min-h-11 w-full items-center gap-2 rounded-md border-[1.5px] px-2 text-start text-sm disabled:opacity-70 lg:min-h-9 ${
											on ? "border-kept bg-tint" : "border-line"
										}`}
									>
										{image ? (
											<img
												loading="lazy"
												decoding="async"
												src={assetPath(image)}
												alt=""
												width={24}
												height={24}
												className="size-6 shrink-0 object-contain [image-rendering:pixelated]"
											/>
										) : (
											<span aria-hidden="true" className="size-6 shrink-0" />
										)}
										<span className="min-w-0 flex-1">{item.name}</span>
										{item.quantity > 1 && (
											<span className="text-muted font-mono text-xs">
												{text.quantity(item.quantity)}
											</span>
										)}
										{quality && (
											<img
												loading="lazy"
												decoding="async"
												src={assetPath(quality)}
												alt={item.quality}
												width={14}
												height={14}
												className="size-3.5 shrink-0 [image-rendering:pixelated]"
											/>
										)}
									</button>
								</li>
							);
						})}
					</ul>
				</>
			)}
			<div className="flex items-center justify-between gap-2">
				<span className="text-muted text-xs">
					{text.reward}: {bundle.reward.name}
					{bundle.reward.quantity > 1 ? ` ${text.quantity(bundle.reward.quantity)}` : ""}
				</span>
				{!locked && (
					<span className="flex gap-1">
						<Button
							variant="secondary"
							aria-label={text.allLabel(bundle.name)}
							onClick={() => onAll(true)}
						>
							{text.all}
						</Button>
						<Button
							variant="secondary"
							aria-label={text.clearLabel(bundle.name)}
							onClick={() => onAll(false)}
						>
							{text.clear}
						</Button>
					</span>
				)}
			</div>
		</Card>
	);
}
