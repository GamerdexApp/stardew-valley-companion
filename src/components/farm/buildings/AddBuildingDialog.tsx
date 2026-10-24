"use client";

import { LuPlus } from "react-icons/lu";
import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { assetPath } from "@/lib/utils/assetPath";
import { addableBuildings, ownedCount } from "@/service/buildings";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { IconButton } from "@/comps/ui/IconButton";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const text = farmText.buildings.add;

interface AddBuildingDialogProps {
	data: GameData;
	onAdd: (type: string) => void;
	onClose: () => void;
}

/** The dialog stays open while the player adds, so several buildings can be added in one visit. */
export function AddBuildingDialog({ data, onAdd, onClose }: AddBuildingDialogProps) {
	const groups = [
		{ builder: "Robin", label: text.robin },
		{ builder: "Wizard", label: text.wizard },
	];

	return (
		<Dialog
			open
			onClose={onClose}
			title={text.title}
			description={text.hint}
			variant="wide"
			footer={<Button onClick={onClose}>{text.done}</Button>}
		>
			{groups.map((group) => (
				<section key={group.builder} className="flex flex-col gap-2">
					<SectionLabel className="text-muted">{group.label}</SectionLabel>
					<ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
						{addableBuildings
							.filter((building) => building.builder === group.builder)
							.map((building) => {
								const owned = ownedCount(data, building.name);
								return (
									<li
										key={building.id}
										className="border-line bg-surface flex items-center gap-3 rounded-md border-[1.5px] p-2"
									>
										<img
											loading="lazy"
											decoding="async"
											width={40}
											height={40}
											src={assetPath(building.image)}
											alt=""
											className="size-10 shrink-0 object-contain [image-rendering:pixelated]"
										/>
										<span className="flex min-w-0 flex-1 flex-col">
											<span className="font-medium">{building.name}</span>
											<span className="text-muted text-xs">
												{building.animalCapacity
													? text.capacity(building.animalCapacity)
													: text.cost(building.buildCost)}
											</span>
										</span>
										{owned > 0 && (
											<span className="text-kept font-mono text-xs font-medium">
												{text.owned(owned)}
											</span>
										)}
										<IconButton
											label={text.add(building.name)}
											onClick={() => onAdd(building.name)}
											className="border-line bg-surface hover:bg-tint border-[1.5px]"
										>
											<LuPlus size={18} aria-hidden="true" />
										</IconButton>
									</li>
								);
							})}
					</ul>
				</section>
			))}
		</Dialog>
	);
}
