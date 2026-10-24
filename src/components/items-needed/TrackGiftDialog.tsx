import { useState } from "react";
import { LuTrash2 } from "react-icons/lu";
import type { GameData } from "@/types/app";
import { itemsNeededText } from "@/lib/messages/itemsNeeded";
import { assetPath } from "@/lib/utils/assetPath";
import {
	ANY_VILLAGER,
	isTracked,
	markGifted,
	trackedGiftsOf,
	trackGift,
	UNIVERSAL_TIERS,
	universalItems,
	unmarkGifted,
	untrackGift,
	villagerGifts,
	villagerLabel,
} from "@/service/itemsNeeded";
import type { UniversalTier } from "@/service/itemsNeeded";
import { allVillagers } from "@/service/villagers";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { IconButton } from "@/comps/ui/IconButton";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const text = itemsNeededText.gifts.dialog;

type Picker =
	{ kind: "villager"; name: string } | { kind: "universal"; tier: UniversalTier } | null;

interface TrackGiftDialogProps {
	data: GameData;
	onClose: () => void;
	edit: (change: (current: GameData) => GameData) => void;
}

export function TrackGiftDialog({ data, onClose, edit }: TrackGiftDialogProps) {
	const [picker, setPicker] = useState<Picker>(null);
	const [gifted, setGifted] = useState<{ villager: string; item: string }[]>([]);
	const tracked = trackedGiftsOf(data);

	const options =
		picker?.kind === "villager"
			? villagerGifts(picker.name).map((gift) => ({ ...gift, villager: picker.name }))
			: picker?.kind === "universal"
				? universalItems(picker.tier).map((name) => ({
						name,
						preference: picker.tier,
						villager: ANY_VILLAGER,
					}))
				: [];

	const giftedNow = (villager: string, item: string) => {
		setGifted([...gifted, { villager, item }]);
		edit((d) => markGifted(d, villager, item));
	};
	const undoLast = () => {
		const last = gifted.at(-1);
		if (!last) return;
		setGifted(gifted.slice(0, -1));
		edit((d) => unmarkGifted(d, last.villager, last.item));
	};

	return (
		<Dialog
			open
			onClose={onClose}
			variant="widest"
			title={text.title}
			description={text.description}
			footer={<Button onClick={onClose}>{text.done}</Button>}
		>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<div className="flex flex-col gap-5">
					<section className="flex flex-col gap-2">
						<h3 className="font-semibold">{text.tracking(tracked.length)}</h3>
						{tracked.length === 0 && (
							<p className="text-muted text-sm">{text.noneTracked}</p>
						)}
						<ul className="flex flex-col gap-1.5">
							{tracked.map((gift) => (
								<li
									key={`${gift.villagerName}-${gift.itemName}`}
									className="border-line flex flex-wrap items-center gap-2 rounded-md border-[1.5px] p-2 text-sm"
								>
									<span className="min-w-0 flex-1">
										{text.forVillager(
											gift.itemName,
											villagerLabel(gift.villagerName)
										)}
									</span>
									{gift.preference && (
										<Badge tone="locked">{gift.preference}</Badge>
									)}
									<Button
										variant="secondary"
										aria-label={itemsNeededText.card.markLabel(
											gift.itemName,
											villagerLabel(gift.villagerName)
										)}
										onClick={() => giftedNow(gift.villagerName, gift.itemName)}
									>
										{itemsNeededText.card.markGifted}
									</Button>
									<IconButton
										label={text.removeLabel(
											gift.itemName,
											villagerLabel(gift.villagerName)
										)}
										onClick={() =>
											edit((d) =>
												untrackGift(d, gift.villagerName, gift.itemName)
											)
										}
										className="text-danger hover:bg-tint"
									>
										<LuTrash2 size={16} aria-hidden="true" />
									</IconButton>
								</li>
							))}
						</ul>
						{gifted.length > 0 && (
							<p className="flex flex-wrap items-center gap-2 text-sm">
								<span className="text-muted">
									{text.recentlyGifted}{" "}
									{gifted
										.map((gift) =>
											text.forVillager(
												gift.item,
												villagerLabel(gift.villager)
											)
										)
										.join(", ")}
								</span>
								<Button variant="link" onClick={undoLast}>
									{text.undoLast}
								</Button>
							</p>
						)}
					</section>
					<section className="flex flex-col gap-2">
						<SectionLabel className="text-muted">{text.universal}</SectionLabel>
						<div className="grid grid-cols-3 gap-2">
							{UNIVERSAL_TIERS.map((tier) => (
								<button
									key={tier}
									type="button"
									aria-pressed={
										picker?.kind === "universal" && picker.tier === tier
									}
									onClick={() => setPicker({ kind: "universal", tier })}
									className={`flex min-h-11 flex-col items-start rounded-md border-[1.5px] px-3 py-2 text-start lg:min-h-9 ${
										picker?.kind === "universal" && picker.tier === tier
											? "border-primary bg-tint"
											: "border-line"
									}`}
								>
									<span className="text-sm font-medium">
										{text.universalTiers[tier]}
									</span>
									<span className="text-muted font-mono text-xs">
										{universalItems(tier).length}
									</span>
								</button>
							))}
						</div>
					</section>
					<section className="flex flex-col gap-2">
						<SectionLabel className="text-muted">
							{text.byVillager(allVillagers.length)}
						</SectionLabel>
						<ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{allVillagers.map((villager) => (
								<li key={villager.id}>
									<button
										type="button"
										aria-pressed={
											picker?.kind === "villager" &&
											picker.name === villager.name
										}
										onClick={() =>
											setPicker({ kind: "villager", name: villager.name })
										}
										className={`flex min-h-11 w-full items-center gap-2 rounded-md border-[1.5px] px-2 text-start text-sm lg:min-h-9 ${
											picker?.kind === "villager" &&
											picker.name === villager.name
												? "border-primary bg-tint"
												: "border-line"
										}`}
									>
										<img
											src={assetPath(villager.image)}
											alt=""
											width={24}
											height={24}
											className="size-6 shrink-0 object-contain [image-rendering:pixelated]"
										/>
										{villager.name}
									</button>
								</li>
							))}
						</ul>
					</section>
				</div>
				<section className="flex flex-col gap-2">
					{picker === null ? (
						<p className="text-muted text-sm">{text.nothingPicked}</p>
					) : (
						<>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<h3 className="font-semibold">
									{picker.kind === "villager"
										? text.pick(picker.name)
										: text.pickUniversal(text.universalTiers[picker.tier])}
								</h3>
								<Button variant="link" onClick={() => setPicker(null)}>
									{text.back}
								</Button>
							</div>
							<p className="text-muted text-xs">{text.pickNote}</p>
							<ul className="flex flex-col gap-1.5">
								{options.map((option) => {
									const on = isTracked(data, option.villager, option.name);
									return (
										<li
											key={`${option.preference}-${option.name}`}
											className="border-line flex items-center gap-2 rounded-md border-[1.5px] p-2 text-sm"
										>
											<span className="min-w-0 flex-1">{option.name}</span>
											<Badge tone="locked">{option.preference}</Badge>
											{on ? (
												<IconButton
													label={text.removeLabel(
														option.name,
														villagerLabel(option.villager)
													)}
													onClick={() =>
														edit((d) =>
															untrackGift(
																d,
																option.villager,
																option.name
															)
														)
													}
													className="text-danger hover:bg-tint"
												>
													<LuTrash2 size={16} aria-hidden="true" />
												</IconButton>
											) : (
												<Button
													variant="secondary"
													aria-label={text.addLabel(
														option.name,
														villagerLabel(option.villager)
													)}
													onClick={() =>
														edit((d) =>
															trackGift(
																d,
																option.villager,
																option.name,
																option.preference
															)
														)
													}
												>
													{text.add}
												</Button>
											)}
										</li>
									);
								})}
							</ul>
						</>
					)}
				</section>
			</div>
		</Dialog>
	);
}
