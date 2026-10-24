"use client";

import type { GeodeContainer } from "stardew-valley-data";
import { useMemo, useState } from "react";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import { allGeodes, filterByName, geodeContents, opensForRandomItems } from "@/service/minerals";
import { SearchBlock } from "@/comps/page/SearchBlock";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { BLOCK_GRID, CollectionBlock, DetailsButton } from "../shared/CollectionBlock";
import { DialogSection, ItemDialog, TextList } from "../shared/ItemDialog";
import { QualityPrices } from "../shared/QualityPrices";

const text = collectionsText.minerals;

function Price({ geode }: { geode: GeodeContainer }) {
	if (geode.sellPrice === 0) {
		return (
			<div className="border-line text-muted rounded-md border-[1.5px] px-2.5 py-1.5 text-xs">
				{text.card.noSellPrice}
			</div>
		);
	}
	return <QualityPrices price={geode.sellPrice} maxQuality="base" />;
}

export function GeodesSection() {
	const [query, setQuery] = useMemoryState("collections:minerals:geodes", "");
	const [selected, setSelected] = useState<GeodeContainer | null>(null);
	const shown = useMemo(() => filterByName(allGeodes, query), [query]);

	return (
		<CollectionBlock
			id="minerals-geodes"
			title={text.blocks.geodes}
			badge={text.badge.types(allGeodes.length)}
		>
			<Card className="p-4">
				<SearchBlock
					label={text.search.geodes}
					value={query}
					onChange={setQuery}
					summary={collectionsText.filters.showing(
						shown.length,
						allGeodes.length,
						text.nouns.geodes
					)}
				/>
			</Card>
			{shown.length === 0 ? (
				<EmptyState
					title={text.empty.title(text.nouns.geodes)}
					description={text.empty.description}
				/>
			) : (
				<div className={BLOCK_GRID}>
					{shown.map((geode) => (
						<Card key={geode.id} className="flex flex-col gap-2.5 p-3">
							<div className="flex items-start gap-3">
								<img
									loading="lazy"
									decoding="async"
									src={assetPath(geode.image)}
									alt=""
									className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
								/>
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<span className="font-semibold">{geode.name}</span>
									<span className="text-muted text-xs">
										{opensForRandomItems(geode)
											? text.card.opensForRandomItems
											: text.card.possibleContents(
													geodeContents(geode).length
												)}
									</span>
								</div>
							</div>
							<Price geode={geode} />
							<DetailsButton
								name={geode.name}
								text={text.card.contentsAndLocations}
								onClick={() => setSelected(geode)}
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
				kind={text.dialog.type.geode}
			>
				{selected && (
					<>
						<p className="text-muted italic">{selected.description}</p>
						<DialogSection title={text.dialog.sellPrice}>
							<Price geode={selected} />
						</DialogSection>
						<DialogSection title={text.dialog.contents(geodeContents(selected).length)}>
							<ul className="flex flex-col gap-1.5">
								{geodeContents(selected).map((line) => (
									<li
										key={line.name}
										className="bg-bg flex items-center justify-between gap-3 rounded-md px-3 py-2"
									>
										<span className="flex min-w-0 items-center gap-2.5">
											{line.image ? (
												<img
													loading="lazy"
													decoding="async"
													src={assetPath(line.image)}
													alt=""
													className="size-7 shrink-0 object-contain [image-rendering:pixelated]"
												/>
											) : (
												<span
													aria-hidden="true"
													className="size-7 shrink-0"
												/>
											)}
											<span className="font-medium">{line.name}</span>
										</span>
										<span className="text-muted flex shrink-0 gap-2 font-mono text-xs">
											{line.quantity && <span>×{line.quantity}</span>}
											{line.chance && <span>{line.chance}</span>}
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
		</CollectionBlock>
	);
}
