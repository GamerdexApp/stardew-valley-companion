"use client";

import { useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { useProfessionPrices } from "@/lib/hooks/useProfessionPrices";
import { collectionsText } from "@/lib/messages/collections";
import {
	allBars,
	allGeodes,
	allMinerals,
	allNodes,
	allOres,
	allResources,
	mineralsSummary,
} from "@/service/minerals";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { ProfessionsControl } from "../shared/ProfessionsControl";
import { SummaryTile } from "../shared/SummaryTile";
import { useMuseumStatusChange, useShippedChange } from "../shared/useCollectionChanges";
import { GeodesSection } from "./GeodesSection";
import { MineralsSection } from "./MineralsSection";
import { NodesSection } from "./NodesSection";
import { ShippableSection } from "./ShippableSection";

const text = collectionsText.minerals;

const JUMP_LINKS = [
	{ id: "minerals-minerals", label: text.blocks.minerals, count: allMinerals.length },
	{ id: "minerals-geodes", label: text.blocks.geodes, count: allGeodes.length },
	{ id: "minerals-ores", label: text.blocks.ores, count: allOres.length },
	{ id: "minerals-bars", label: text.blocks.bars, count: allBars.length },
	{ id: "minerals-resources", label: text.blocks.resources, count: allResources.length },
	{ id: "minerals-nodes", label: text.blocks.nodes, count: allNodes.length },
];

export function MineralsTab({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const summary = useMemo(() => mineralsSummary(data), [data]);
	const professions = useProfessionPrices(
		"collections:minerals:professions",
		data,
		text.professions
	);
	const changeStatus = useMuseumStatusChange(playthrough.id, "minerals");
	const shipped = useShippedChange(playthrough.id);

	const shippableProps = {
		data,
		bonusFor: (
			item:
				(typeof allOres)[number] | (typeof allBars)[number] | (typeof allResources)[number]
		) => professions.bonusFor(item.sellPrice, item.profession),
		onShippedChange: (item: { id: string; name: string }, isShipped: boolean) =>
			shipped.setShipped(data, item.name, item.id, isShipped),
		onCountChange: (item: { id: string }, count: number) => shipped.setCount(item.id, count),
	};

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
				<SummaryTile label={text.tiles.totalMinerals} value={allMinerals.length} />
				<SummaryTile
					label={text.tiles.found}
					value={summary.found.current}
					total={summary.found.total}
					emphasis
				/>
				<SummaryTile
					label={text.tiles.donated}
					value={summary.donated}
					total={allMinerals.length}
				/>
				<SummaryTile label={text.tiles.totalOres} value={allOres.length} />
				<SummaryTile
					label={text.tiles.oresShipped}
					value={summary.oresShipped}
					total={allOres.length}
				/>
				<SummaryTile label={text.tiles.totalBars} value={allBars.length} />
				<SummaryTile
					label={text.tiles.barsShipped}
					value={summary.barsShipped}
					total={allBars.length}
				/>
				<SummaryTile label={text.tiles.totalResources} value={allResources.length} />
				<SummaryTile
					label={text.tiles.resourcesShipped}
					value={summary.resourcesShipped}
					total={allResources.length}
				/>
				<SummaryTile label={text.tiles.totalGeodes} value={allGeodes.length} />
				<SummaryTile label={text.tiles.totalNodes} value={allNodes.length} />
			</div>
			<ProfessionsControl {...professions.control} />
			<nav aria-label={text.jumpLabel} className="flex flex-wrap items-center gap-2">
				<SectionLabel className="text-muted me-1">{text.jumpLabel}</SectionLabel>
				{JUMP_LINKS.map((link) => (
					<a
						key={link.id}
						href={`#${link.id}`}
						className="border-line bg-surface hover:bg-tint flex min-h-11 items-center gap-2 rounded-full border-[1.5px] px-3.5 lg:min-h-9"
					>
						{link.label}
						<span className="text-muted font-mono text-xs">{link.count}</span>
					</a>
				))}
			</nav>
			<MineralsSection
				data={data}
				bonusFor={(mineral) => professions.bonusFor(mineral.sellPrice, mineral.profession)}
				onStatusChange={(mineral, status) =>
					changeStatus(data, mineral.name, mineral.id, status)
				}
			/>
			<GeodesSection />
			<ShippableSection block="ores" items={allOres} {...shippableProps} />
			<ShippableSection block="bars" items={allBars} {...shippableProps} />
			<ShippableSection block="resources" items={allResources} {...shippableProps} />
			<NodesSection />
		</>
	);
}
