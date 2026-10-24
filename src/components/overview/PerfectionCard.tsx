import { LuCheck } from "react-icons/lu";
import type { GameData } from "@/types/app";
import { overviewText } from "@/lib/messages/overview";
import { isCategoryDone, perfectionFigures } from "@/service/overview";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { OverviewCard } from "./OverviewCard";

const text = overviewText.perfection;

export function PerfectionCard({ data }: { data: GameData }) {
	const { score, waivers, categories } = perfectionFigures(data);

	return (
		<OverviewCard
			title={text.title}
			badge={text.badge(score)}
			link={{ href: "/perfection", label: overviewText.open.perfection }}
		>
			<div className="flex items-baseline gap-3">
				<span className="text-primary font-mono text-4xl">{score}%</span>
				<span className="flex flex-col">
					<span className="text-muted">{text.score}</span>
					{waivers > 0 && (
						<span className="text-xs font-medium">{text.waivers(waivers)}</span>
					)}
				</span>
			</div>
			<ul className="flex flex-col">
				{categories.map((category) => {
					const done = isCategoryDone(category);
					return (
						<li
							key={category.id}
							className="border-line flex items-center gap-3 border-t-[1.5px] py-2 first:border-t-0"
						>
							<div className="w-14 shrink-0">
								<ProgressBar
									value={
										category.total > 0 ? category.current / category.total : 0
									}
									label={category.name}
								/>
							</div>
							<span className="flex-1 font-medium">{category.name}</span>
							{done ? (
								<span className="text-kept flex items-center gap-1 text-xs font-medium">
									<LuCheck size={14} aria-hidden="true" />
									{text.done}
								</span>
							) : (
								<span className="text-muted font-mono text-xs">
									{category.current} / {category.total}
								</span>
							)}
						</li>
					);
				})}
			</ul>
		</OverviewCard>
	);
}
