import type { ReactNode } from "react";
import { gearText } from "@/lib/messages/gear";
import { assetPath } from "@/lib/utils/assetPath";
import { formatNumber } from "@/lib/utils/formatting";
import { Card } from "@/comps/ui/Card";

interface GearCardProps {
	image: string;
	name: string;
	/** A tag beside the name, such as the weapon type. */
	tag?: ReactNode;
	/** Short stat lines in a row, such as damage and speed. */
	stats?: string[];
	/** Paragraphs under the stats, such as how to get the item. */
	lines?: string[];
	chips?: string[];
	sellPrice?: number | null;
}

export function GearCard({
	image,
	name,
	tag,
	stats = [],
	lines = [],
	chips = [],
	sellPrice,
}: GearCardProps) {
	return (
		<Card className="flex flex-col gap-2 p-3">
			<div className="flex items-start gap-3">
				<img
					loading="lazy"
					decoding="async"
					src={assetPath(image)}
					alt=""
					width={40}
					height={40}
					className="size-10 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="font-semibold">{name}</span>
					{tag}
				</div>
			</div>
			{stats.length > 0 && (
				<ul className="text-muted flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-xs">
					{stats.map((stat) => (
						<li key={stat}>{stat}</li>
					))}
				</ul>
			)}
			{lines.map((line) => (
				<p key={line} className="text-muted text-sm">
					{line}
				</p>
			))}
			{chips.length > 0 && (
				<ul className="flex flex-wrap gap-1">
					{chips.map((chip) => (
						<li
							key={chip}
							className="border-line text-muted rounded-md border-[1.5px] px-1.5 py-0.5 text-xs"
						>
							{chip}
						</li>
					))}
				</ul>
			)}
			{sellPrice != null && (
				<span className="text-xs">
					<span className="text-muted">{gearText.sellPrice}</span>{" "}
					<span className="font-mono font-medium">{formatNumber(sellPrice)}g</span>
				</span>
			)}
		</Card>
	);
}
