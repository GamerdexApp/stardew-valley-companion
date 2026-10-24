"use client";

import type { Playthrough } from "@/types/app";
import { perfectionText } from "@/lib/messages/perfection";
import { perfectionView, setWaivers } from "@/service/perfection";
import { PageHeader } from "@/comps/shell/PageHeader";
import { PlaythroughGate } from "@/comps/shell/PlaythroughGate";
import { Section } from "@/comps/ui/Section";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { useFarmEdit } from "../farm/useFarmEdit";
import { CategoryRow } from "./CategoryRow";
import { FormulaSection } from "./FormulaSection";
import { WaiversSection } from "./WaiversSection";

const text = perfectionText;

function PerfectionContent({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const { edit } = useFarmEdit(playthrough.id, data);
	const view = perfectionView(data);
	const farm = data.character.farmName;

	return (
		<>
			<PageHeader
				title={text.title}
				subline={text.subline(farm ? `${farm} Farm` : playthrough.name)}
			/>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<SummaryTile
					label={text.tiles.score}
					value={`${view.score}%`}
					emphasis={view.score >= 100}
				/>
				<SummaryTile
					label={text.tiles.categories}
					value={view.complete}
					total={view.rows.length}
				/>
				<SummaryTile label={text.tiles.waivers} value={view.waivers} />
			</div>
			<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
				<WaiversSection
					waivers={view.waivers}
					onChange={(count) => edit((d) => setWaivers(d, count))}
				/>
				<FormulaSection view={view} />
			</div>
			<Section
				title={text.categories.title}
				badge={text.categories.badge(view.complete, view.rows.length)}
			>
				<p className="text-muted text-sm">{text.categories.hint}</p>
				<ul className="flex flex-col gap-2">
					{view.rows.map((row) => (
						<li key={row.category.id}>
							<CategoryRow row={row} />
						</li>
					))}
				</ul>
			</Section>
		</>
	);
}

export function PerfectionPage() {
	return (
		<PlaythroughGate title={text.title}>
			{(playthrough) => <PerfectionContent playthrough={playthrough} />}
		</PlaythroughGate>
	);
}
