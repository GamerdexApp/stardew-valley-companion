import { LuCheck, LuX } from "react-icons/lu";
import type { GameData } from "@/types/app";
import { overviewText } from "@/lib/messages/overview";
import { minesFigures } from "@/service/overview";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { MeterRow, OverviewCard } from "./OverviewCard";

const text = overviewText.mines;

export function MinesCard({ data }: { data: GameData }) {
	const figures = minesFigures(data);

	return (
		<OverviewCard
			title={text.title}
			badge={text.badge(figures.goalsDone, figures.goals.length)}
			link={{ href: "/mines", label: overviewText.open.mines }}
		>
			<MeterRow
				label={text.depth}
				value={`${figures.mineDepth.current} / ${figures.mineDepth.total}`}
				progress={figures.mineDepth.current / figures.mineDepth.total}
			/>
			<div className="flex flex-col gap-1.5">
				<div className="flex items-baseline justify-between gap-3">
					<span className="font-medium">{text.skullCavern}</span>
					<span className="text-muted font-mono text-xs">
						{text.skullLevel(figures.skullCavernLevel)}
					</span>
				</div>
				<ProgressBar value={figures.skullCavernBar} label={text.skullCavern} />
				<p className="text-muted text-xs">{text.skullCaption}</p>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<span className="font-medium">{text.keys}</span>
				{figures.keys.map((key) => (
					<span
						key={key.label}
						className={`flex items-center gap-1 rounded-full border-[1.5px] px-2.5 py-0.5 text-xs font-medium ${
							key.owned ? "border-kept text-kept" : "border-line text-muted"
						}`}
					>
						{key.owned ? (
							<LuCheck size={12} aria-hidden="true" />
						) : (
							<LuX size={12} aria-hidden="true" />
						)}
						{key.label}: {key.owned ? text.owned : text.notOwned}
					</span>
				))}
			</div>
			<div className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
				<SectionLabel className="text-muted">{text.goals}</SectionLabel>
				<ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
					{figures.goals.map((goal) => (
						<li key={goal.name} className="flex items-center justify-between gap-2">
							<span>{goal.name}</span>
							<span
								className={`flex items-center gap-1 text-xs font-medium ${goal.done ? "text-kept" : "text-muted"}`}
							>
								{goal.done ? (
									<LuCheck size={14} aria-hidden="true" />
								) : (
									<LuX size={14} aria-hidden="true" />
								)}
								{goal.done ? text.goalDone : text.goalOpen}
							</span>
						</li>
					))}
				</ul>
			</div>
		</OverviewCard>
	);
}
