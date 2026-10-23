"use client";

import type { NodeItem } from "stardew-valley-data";
import { useMemo, useState } from "react";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import { allNodes, filterByName, mineralNameById } from "@/service/minerals";
import { SearchBlock } from "@/comps/page/SearchBlock";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { DialogSection, ItemDialog, TextList } from "../shared/ItemDialog";
import { BLOCK_GRID, DetailsButton, MineralsBlock } from "./MineralsBlock";

const text = collectionsText.minerals;
const VISIBLE_DROPS = 3;

const chip = "border-line text-muted rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium";

export function NodesSection() {
	const [query, setQuery] = useMemoryState("collections:minerals:nodes", "");
	const [selected, setSelected] = useState<NodeItem | null>(null);
	const shown = useMemo(() => filterByName(allNodes, query), [query]);

	return (
		<MineralsBlock
			id="minerals-nodes"
			title={text.blocks.nodes}
			badge={text.badge.nodes(allNodes.length)}
		>
			<Card className="p-4">
				<SearchBlock
					label={text.search.nodes}
					value={query}
					onChange={setQuery}
					summary={collectionsText.filters.showing(
						shown.length,
						allNodes.length,
						text.nouns.nodes
					)}
				/>
			</Card>
			{shown.length === 0 ? (
				<EmptyState
					title={text.empty.title(text.nouns.nodes)}
					description={text.empty.description}
				/>
			) : (
				<div className={BLOCK_GRID}>
					{shown.map((node) => (
						<Card key={node.id} className="flex flex-col gap-2.5 p-3">
							<div className="flex items-start gap-3">
								<img
									src={assetPath(node.image)}
									alt=""
									className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
								/>
								<span className="min-w-0 flex-1 font-semibold">{node.name}</span>
								<span className="border-line text-changed shrink-0 rounded-md border-[1.5px] px-1.5 py-0.5 font-mono text-xs font-medium">
									{text.card.xp(node.miningXP)}
								</span>
							</div>
							<ul className="flex flex-wrap gap-1">
								{node.drops.slice(0, VISIBLE_DROPS).map((drop) => (
									<li key={drop.item} className={chip}>
										{text.card.drop(mineralNameById(drop.item), drop.quantity)}
									</li>
								))}
								{node.drops.length > VISIBLE_DROPS && (
									<li className={chip}>
										{text.card.moreDrops(node.drops.length - VISIBLE_DROPS)}
									</li>
								)}
							</ul>
							<DetailsButton
								label={text.card.details(node.name)}
								text={text.card.dropsAndLocations}
								onClick={() => setSelected(node)}
							/>
						</Card>
					))}
				</div>
			)}
			<ItemDialog
				open={selected !== null}
				onClose={() => setSelected(null)}
				closeLabel={text.dialog.close}
				title={selected?.name ?? ""}
				image={selected?.image ?? ""}
				kind={text.dialog.type.node}
			>
				{selected && (
					<>
						<p className="text-muted italic">{selected.description}</p>
						<DialogSection title={text.dialog.miningXp}>
							<span className="font-mono font-medium">
								{text.card.xp(selected.miningXP)}
							</span>
						</DialogSection>
						<DialogSection title={text.dialog.drops}>
							<ul className="flex flex-col gap-1.5">
								{selected.drops.map((drop) => (
									<li
										key={drop.item}
										className="bg-bg flex items-center justify-between gap-3 rounded-md px-3 py-2"
									>
										<span className="font-medium">
											{mineralNameById(drop.item)}
										</span>
										<span className="text-muted flex gap-2 font-mono text-xs">
											<span>×{drop.quantity}</span>
											{drop.chance && <span>{drop.chance}</span>}
										</span>
									</li>
								))}
							</ul>
						</DialogSection>
						{selected.locations.length > 0 && (
							<DialogSection title={text.dialog.howToFind}>
								<TextList items={selected.locations} />
							</DialogSection>
						)}
					</>
				)}
			</ItemDialog>
		</MineralsBlock>
	);
}
