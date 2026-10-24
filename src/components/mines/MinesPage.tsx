"use client";

import type { Playthrough } from "@/types/app";
import { minesText } from "@/lib/messages/mines";
import {
	allMonsters,
	minesSummary,
	setMineLevel,
	setMonsterKills,
	setRustyKey,
	setSkullKey,
	setSkullLevel,
} from "@/service/mines";
import { PageHeader } from "@/comps/shell/PageHeader";
import { PlaythroughGate } from "@/comps/shell/PlaythroughGate";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { useFarmEdit } from "../farm/useFarmEdit";
import { MineProgressSection } from "./MineProgressSection";
import { MonstersSection } from "./MonstersSection";
import { SlayerGoalsSection } from "./SlayerGoalsSection";

const text = minesText;

function MinesContent({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const { edit } = useFarmEdit(playthrough.id, data);
	const summary = minesSummary(data);
	const yesNo = (has: boolean) => (has ? text.tiles.yes : text.tiles.no);

	return (
		<>
			<PageHeader
				title={text.title}
				subline={text.subline(
					summary.mineLevel,
					summary.skullLevel,
					summary.goalsDone,
					summary.goalsTotal
				)}
			/>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
				<SummaryTile label={text.tiles.mine} value={summary.mineLevel} />
				<SummaryTile label={text.tiles.skull} value={summary.skullLevel} />
				<SummaryTile label={text.tiles.rusty} value={yesNo(summary.rustyKey)} />
				<SummaryTile label={text.tiles.skullKey} value={yesNo(summary.skullKey)} />
				<SummaryTile
					label={text.tiles.goals}
					value={summary.goalsDone}
					total={summary.goalsTotal}
					emphasis={summary.goalsDone === summary.goalsTotal}
				/>
				<SummaryTile label={text.tiles.slain} value={summary.totalSlain.toLocaleString()} />
			</div>
			<MineProgressSection
				data={data}
				onMines={(floor) => edit((d) => setMineLevel(d, floor))}
				onSkull={(floor) => edit((d) => setSkullLevel(d, floor))}
				onRustyKey={(has) => edit((d) => setRustyKey(d, has))}
				onSkullKey={(has) => edit((d) => setSkullKey(d, has))}
			/>
			<SlayerGoalsSection data={data} />
			<MonstersSection
				data={data}
				totalSlain={summary.totalSlain}
				onKills={(name, count) =>
					edit((d) =>
						setMonsterKills(
							d,
							allMonsters.find((monster) => monster.name === name)!,
							count
						)
					)
				}
			/>
		</>
	);
}

export function MinesPage() {
	return (
		<PlaythroughGate title={text.title}>
			{(p) => <MinesContent playthrough={p} />}
		</PlaythroughGate>
	);
}
