import { useMemo } from "react";
import type { GameData } from "@/types/app";
import { collectionsText } from "@/lib/messages/collections";
import { countCompleteSections, overviewSections } from "@/service/collectionsOverview";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { OverviewSectionCard } from "./OverviewSectionCard";

const text = collectionsText.overview;

export function OverviewTab({ data }: { data: GameData }) {
	const sections = useMemo(() => overviewSections(data), [data]);

	return (
		<>
			<section
				aria-label={text.summaryLabel}
				className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7"
			>
				<SummaryTile
					label={text.tiles.collections}
					value={countCompleteSections(sections)}
					total={sections.length}
					emphasis
				/>
				{sections.map((section) => (
					<SummaryTile
						key={section.id}
						label={text.tiles[section.id]}
						value={section.done}
						total={section.total}
					/>
				))}
			</section>
			<p className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
				<span className="flex items-center gap-2">
					<span
						aria-hidden="true"
						className="bg-track border-primary size-4.5 rounded-sm border-[1.5px]"
					/>
					{text.legend.complete}
				</span>
				<span className="flex items-center gap-2">
					<span aria-hidden="true" className="bg-track size-4.5 rounded-sm opacity-50" />
					{text.legend.notYet}
				</span>
				<span>{text.legend.rule}</span>
			</p>
			{sections.map((section) => (
				<OverviewSectionCard key={section.id} section={section} />
			))}
		</>
	);
}
