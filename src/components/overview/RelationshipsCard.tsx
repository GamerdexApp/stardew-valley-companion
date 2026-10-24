import { LuHeart } from "react-icons/lu";
import type { GameData } from "@/types/app";
import { overviewText } from "@/lib/messages/overview";
import { maxedVillagers, villagerRows } from "@/service/overview";
import type { VillagerRow } from "@/service/overview";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { OverviewCard } from "./OverviewCard";

const text = overviewText.relationships;

function SpouseRow({ row }: { row: VillagerRow }) {
	return (
		<div className="border-heart flex items-center gap-4 rounded-md border-[1.5px] px-3 py-2.5">
			<img
				loading="lazy"
				decoding="async"
				src={row.image}
				alt=""
				className="size-11 shrink-0 object-contain [image-rendering:pixelated]"
			/>
			<div className="flex min-w-0 flex-col gap-1">
				<span className="font-semibold">{text.spouse(row.name)}</span>
				<span aria-hidden="true" className="text-heart flex flex-wrap gap-0.5">
					{Array.from({ length: row.maxHearts }, (_, index) => (
						<LuHeart
							key={index}
							size={14}
							fill={index < row.hearts ? "currentColor" : "none"}
						/>
					))}
				</span>
				<span className="text-muted text-xs">{text.hearts(row.hearts, row.maxHearts)}</span>
			</div>
		</div>
	);
}

function VillagerTile({ row }: { row: VillagerRow }) {
	return (
		<li
			className={`flex flex-col items-center gap-1 rounded-md border-[1.5px] p-2 ${
				row.maxed ? "border-primary bg-tint" : "border-line"
			}`}
		>
			<img
				loading="lazy"
				decoding="async"
				src={row.image}
				alt=""
				className="size-9 object-contain [image-rendering:pixelated]"
			/>
			<div className="w-full">
				<ProgressBar
					value={row.maxHearts > 0 ? row.hearts / row.maxHearts : 0}
					label={`${row.name} hearts`}
				/>
			</div>
			<span className="max-w-full truncate text-xs font-medium">{row.name}</span>
			<span className="text-muted font-mono text-xs">
				{text.tile(row.hearts, row.maxHearts)}
				{row.maxed && <span className="sr-only"> {text.maxedTag}</span>}
			</span>
		</li>
	);
}

export function RelationshipsCard({ data }: { data: GameData }) {
	const rows = villagerRows(data);
	const maxed = maxedVillagers(rows);
	const spouse = rows.find((row) => row.married);

	return (
		<OverviewCard
			title={text.title}
			badge={text.badge(maxed.current, maxed.total)}
			link={{ href: "/villagers", label: overviewText.open.villagers }}
		>
			{spouse && <SpouseRow row={spouse} />}
			<ul className="grid grid-cols-4 gap-2 lg:grid-cols-8">
				{rows
					.filter((row) => !row.married)
					.map((row) => (
						<VillagerTile key={row.name} row={row} />
					))}
			</ul>
		</OverviewCard>
	);
}
