"use client";

import { LuLandmark, LuShoppingCart } from "react-icons/lu";
import { newPlaythroughText } from "@/lib/messages/newPlaythrough";
import {
	activeCountInRoom,
	chooseBundlePath,
	isRoomFull,
	roomsFor,
	setRemix,
	toggleBundle,
	toggleItem,
} from "@/service/newPlaythrough";
import type { BundleConfig, RoomBundles } from "@/service/newPlaythrough";
import { ROOM_LABELS } from "@/data/constants/bundles";
import { Checkbox } from "@/comps/ui/Checkbox";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { PathTile } from "./PathTile";

const text = newPlaythroughText.bundles;

const typeOptions = [
	{ id: "standard", label: text.standard },
	{ id: "remix", label: text.remix },
] as const;

interface BundlesStepProps {
	config: BundleConfig;
	onChange: (config: BundleConfig) => void;
}

function RoomPanel({ room, config, onChange }: { room: RoomBundles } & BundlesStepProps) {
	const active = activeCountInRoom(config, room);
	const full = isRoomFull(config, room);

	return (
		<details className="border-line bg-surface rounded-md border-[1.5px]">
			<summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 font-semibold lg:min-h-9">
				{ROOM_LABELS[room.room]}
				{config.isRemix ? (
					<span
						className={`text-xs font-normal ${active === room.slots ? "text-kept" : "text-warn"}`}
					>
						{text.roomSelected(active, room.slots)}
					</span>
				) : (
					<span className="text-muted text-xs font-normal">
						{text.roomBundles(room.bundles.length)}
					</span>
				)}
			</summary>
			<div className="flex flex-col gap-3 p-3">
				{room.bundles.map((bundle) => {
					const isActive = config.activeBundles.includes(bundle.id);
					const disabled = config.isRemix && !isActive && full;
					const picked = config.selectedItems[bundle.id] ?? [];
					const heading = (
						<span>
							{bundle.name}
							{bundle.type === "gold" && (
								<span className="text-gold ms-2 text-sm">
									{text.goldCost(bundle.goldCost.toLocaleString("en-US"))}
								</span>
							)}
							{"remixBundle" in bundle && bundle.remixBundle && (
								<span className="text-iridium ms-2 text-xs">{text.remixTag}</span>
							)}
						</span>
					);
					return (
						<div
							key={bundle.id}
							className={`rounded-md border-[1.5px] p-3 ${
								isActive ? "border-primary bg-tint" : "border-line"
							}`}
						>
							{config.isRemix ? (
								<Checkbox
									label={bundle.name}
									checked={isActive}
									disabled={disabled}
									onChange={() => onChange(toggleBundle(config, bundle.id))}
								/>
							) : (
								<h4 className="font-medium">{heading}</h4>
							)}
							{config.isRemix && (
								<p className="text-muted -mt-1 ps-8 text-xs">
									{bundle.type === "gold" &&
										text.goldCost(bundle.goldCost.toLocaleString("en-US"))}
									{"remixBundle" in bundle &&
										bundle.remixBundle &&
										` ${text.remixTag}`}
								</p>
							)}
							{bundle.type === "items" && isActive && (
								<div className="mt-2 flex flex-col ps-2">
									<p className="text-muted text-xs">
										{text.selectItems(
											bundle.itemsRequired,
											bundle.items.length
										)}
									</p>
									{bundle.items.map((item, index) => {
										const itemIndex = String(index);
										const selected = picked.includes(itemIndex);
										return (
											<Checkbox
												key={itemIndex}
												label={text.itemLabel(
													item.name,
													item.quantity,
													item.quality
												)}
												checked={selected}
												disabled={
													!selected &&
													picked.length >= bundle.itemsRequired
												}
												onChange={() =>
													onChange(
														toggleItem(
															config,
															bundle.id,
															itemIndex,
															bundle.itemsRequired
														)
													)
												}
											/>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</details>
	);
}

export function BundlesStep({ config, onChange }: BundlesStepProps) {
	return (
		<div className="flex flex-col gap-4">
			<p className="text-muted">{text.choosePath}</p>
			<div className="grid gap-4 sm:grid-cols-2" role="group" aria-label={text.pathLabel}>
				<PathTile
					icon={<LuLandmark size={40} />}
					title={text.cc.title}
					body={text.cc.body}
					selected={config.path === "cc"}
					onSelect={() => onChange(chooseBundlePath(config, "cc"))}
				/>
				<PathTile
					icon={<LuShoppingCart size={40} />}
					title={text.joja.title}
					body={text.joja.body}
					selected={config.path === "joja"}
					onSelect={() => onChange(chooseBundlePath(config, "joja"))}
				/>
			</div>
			{config.path === "joja" && (
				<p className="bg-tint rounded-md p-3 text-center">{text.jojaChosen}</p>
			)}
			{config.path === "cc" && (
				<>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<span className="font-medium">{text.typeLabel}</span>
						<SegmentedControl
							label={text.typeLabel}
							options={[...typeOptions]}
							value={config.isRemix ? "remix" : "standard"}
							onChange={(type) => onChange(setRemix(config, type === "remix"))}
						/>
					</div>
					{config.isRemix && <p className="text-muted text-xs">{text.remixHint}</p>}
					<div className="flex flex-col gap-2">
						{roomsFor(config.isRemix).map((room) => (
							<RoomPanel
								key={room.room}
								room={room}
								config={config}
								onChange={onChange}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
}
