"use client";

import { maps } from "stardew-valley-data";
import { useState } from "react";
import { farmText } from "@/lib/messages/farm";
import { assetPath } from "@/lib/utils/assetPath";
import { FARM_TYPE_LABELS } from "@/data/constants/farms";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Dialog } from "@/comps/ui/Dialog";

const text = farmText.character.map;
const allMaps = maps().get();

/** The farm type of the playthrough with its map. The type is set when the playthrough is made. */
export function MapCard({ farmType }: { farmType: number }) {
	const [open, setOpen] = useState(false);
	const type = FARM_TYPE_LABELS[farmType] ?? FARM_TYPE_LABELS[0];
	const map = allMaps.find((item) => Number(item.id) === farmType) ?? allMaps[0];

	return (
		<Card className="flex flex-wrap items-center gap-3 p-4">
			<img
				src={assetPath(map.icon)}
				alt=""
				className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
			/>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="font-semibold">{text.farmType(type)}</span>
				<span className="text-muted text-sm">{text.note}</span>
			</div>
			<Button onClick={() => setOpen(true)} aria-haspopup="dialog">
				{text.view}
			</Button>
			<Dialog
				open={open}
				onClose={() => setOpen(false)}
				title={text.title(type)}
				variant="wide"
				footer={<Button onClick={() => setOpen(false)}>{text.close}</Button>}
			>
				<img
					src={assetPath(map.image)}
					alt={text.title(type)}
					className="w-full object-contain"
				/>
			</Dialog>
		</Card>
	);
}
