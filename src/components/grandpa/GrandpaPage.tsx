"use client";

import type { Playthrough } from "@/types/app";
import { grandpaText } from "@/lib/messages/grandpa";
import { formatNumber } from "@/lib/utils/formatting";
import { evaluate, roomsDone, totalSkillLevels } from "@/service/grandpa";
import type { CategoryView } from "@/service/grandpa";
import { GRANDPA_CATEGORY_ORDER } from "@/data/constants/grandpa";
import { PageHeader } from "@/comps/shell/PageHeader";
import { PlaythroughGate } from "@/comps/shell/PlaythroughGate";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { CandlesCard } from "./CandlesCard";
import { CategorySection } from "./CategorySection";

const text = grandpaText;

function GrandpaContent({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const evaluation = evaluate(data);
	const farm = data.character.farmName;
	const rooms = roomsDone(data);

	const noteFor = (category: CategoryView): string => {
		switch (category.id) {
			case "earnings":
				return text.notes.earnings(`${formatNumber(data.character.totalMoneyEarned)}g`);
			case "skills":
				return text.notes.skills(totalSkillLevels(data));
			case "community-center":
				return text.notes["community-center"](rooms.current, rooms.total);
			default:
				return text.notes[category.id];
		}
	};

	return (
		<>
			<PageHeader
				title={text.title}
				subline={text.subline(farm ? `${farm} Farm` : playthrough.name)}
			/>
			<CandlesCard evaluation={evaluation} />
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<SummaryTile
					label={text.tiles.score}
					value={evaluation.score}
					total={21}
					emphasis={evaluation.score >= 12}
				/>
				<SummaryTile label={text.tiles.candles} value={evaluation.candles} total={4} />
				<SummaryTile
					label={text.tiles.categories}
					value={evaluation.categoriesComplete}
					total={GRANDPA_CATEGORY_ORDER.length}
				/>
			</div>
			{evaluation.categories.map((category) => (
				<CategorySection
					key={category.id}
					category={category}
					note={noteFor(category)}
					link={
						category.id === "achievements"
							? { href: "/farm?tab=character", label: text.characterLink }
							: undefined
					}
				/>
			))}
			<p className="text-muted text-sm">{text.footer}</p>
		</>
	);
}

export function GrandpaPage() {
	return (
		<PlaythroughGate title={text.title}>
			{(playthrough) => <GrandpaContent playthrough={playthrough} />}
		</PlaythroughGate>
	);
}
