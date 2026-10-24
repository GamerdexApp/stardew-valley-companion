import Link from "next/link";
import { LuCheck, LuChevronDown } from "react-icons/lu";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import type { OverviewSection, OverviewTile } from "@/service/collectionsOverview";
import { Card } from "@/comps/ui/Card";

const text = collectionsText.overview;

function Tile({ tile }: { tile: OverviewTile }) {
	return (
		<span
			role="img"
			aria-label={text.tile(tile.name, tile.complete)}
			className="flex min-w-0 flex-col items-center gap-1 px-0 py-0.5 lg:px-0.5 lg:py-1.5"
		>
			<span className="relative size-6.5 shrink-0 lg:size-9">
				<span
					className={`bg-track box-border block size-full rounded-md ${
						tile.complete ? "border-primary border-[1.5px]" : "opacity-50"
					}`}
				/>
				<img
					loading="lazy"
					decoding="async"
					src={assetPath(tile.image)}
					alt=""
					className={`absolute inset-0 size-full object-contain p-0.5 [image-rendering:pixelated] ${
						tile.complete ? "" : "opacity-40 grayscale"
					}`}
				/>
				{tile.complete && (
					<span className="bg-primary text-on-primary absolute -right-0.5 -bottom-0.5 flex size-3 items-center justify-center rounded-full lg:size-4">
						<LuCheck
							aria-hidden="true"
							className="size-2 lg:size-2.5"
							strokeWidth={3}
						/>
					</span>
				)}
			</span>
			<span
				aria-hidden="true"
				className={`hidden max-w-full truncate text-[10px] lg:block ${
					tile.complete ? "text-primary font-semibold" : "text-muted"
				}`}
			>
				{tile.name}
			</span>
		</span>
	);
}

export function OverviewSectionCard({ section }: { section: OverviewSection }) {
	const heading = `${section.id}-heading`;
	const gridId = `${section.id}-tiles`;
	const [collapsed, setCollapsed] = useMemoryState(`collections:overview:${section.id}`, false);
	return (
		<Card className="flex flex-col gap-3 p-4.5" aria-labelledby={heading} role="region">
			<div className="flex items-center justify-between gap-3">
				<h2 id={heading} className="min-w-0 flex-1 text-lg font-semibold">
					<button
						type="button"
						aria-expanded={!collapsed}
						aria-controls={gridId}
						onClick={() => setCollapsed(!collapsed)}
						className="hover:bg-tint -ms-2 flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-start lg:min-h-9"
					>
						<LuChevronDown
							aria-hidden="true"
							size={18}
							className={`text-muted shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`}
						/>
						{text.sections[section.id]}
					</button>
				</h2>
				<span className="border-line rounded-full border-[1.5px] px-2.5 py-0.5 font-mono text-xs whitespace-nowrap">
					{section.done} / {section.total}
				</span>
			</div>
			<div className="flex items-center justify-between gap-3">
				<span className="text-muted text-sm">
					{text.complete(section.done, section.total)}
				</span>
				<Link
					href={`/collections?tab=${section.tab}`}
					className="text-link flex min-h-11 items-center font-semibold lg:min-h-6"
				>
					{text.open[section.id]}
				</Link>
			</div>
			<div id={gridId} hidden={collapsed} className="grid grid-cols-10 gap-[3px] lg:gap-1.5">
				{section.tiles.map((tile) => (
					<Tile key={tile.id} tile={tile} />
				))}
			</div>
		</Card>
	);
}
