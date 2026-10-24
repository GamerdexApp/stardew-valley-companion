import type { GameData } from "@/types/app";
import { overviewText } from "@/lib/messages/overview";
import { MAX_SKILL_LEVEL, skillRows, skillTotal, toolChips } from "@/service/overview";
import type { ToolTone } from "@/service/overview";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { OverviewCard } from "./OverviewCard";

const text = overviewText.skills;

const toneClasses: Record<ToolTone, string> = {
	basic: "text-muted",
	copper: "text-warn",
	steel: "text-silver",
	gold: "text-gold",
	iridium: "text-iridium",
};

export function SkillsToolsCard({ data }: { data: GameData }) {
	return (
		<OverviewCard
			title={text.title}
			badge={text.badge(skillTotal(data))}
			link={{ href: "/farm", label: overviewText.open.farm }}
		>
			<ul className="flex flex-col gap-3">
				{skillRows(data).map((row) => (
					<li key={row.key} className="flex items-center gap-3">
						<img
							loading="lazy"
							decoding="async"
							src={row.image}
							alt=""
							className="size-5 shrink-0 object-contain [image-rendering:pixelated]"
						/>
						<span className="w-20 shrink-0 font-medium">{row.label}</span>
						<div className="flex-1">
							<ProgressBar value={row.level / MAX_SKILL_LEVEL} label={row.label} />
						</div>
						<span className="w-6 shrink-0 text-end font-mono text-xs">{row.level}</span>
						<span className="flex size-6 shrink-0 items-center justify-center">
							{row.mastered && (
								<span
									role="img"
									aria-label={`${row.label}: ${text.mastery}`}
									title={text.mastery}
									className="border-gold text-gold flex size-6 items-center justify-center rounded-full border-[1.5px] text-xs font-semibold"
								>
									M
								</span>
							)}
						</span>
					</li>
				))}
			</ul>
			<p className="text-muted text-xs">{text.caption}</p>
			<div className="border-line flex flex-col gap-2 border-t-[1.5px] pt-3">
				<SectionLabel className="text-muted">{text.tools}</SectionLabel>
				<ul className="flex flex-wrap gap-2">
					{toolChips(data).map((chip) => (
						<li
							key={chip.label}
							className="border-line flex items-center gap-2 rounded-md border-[1.5px] px-2.5 py-1"
						>
							<span className="font-medium">{chip.label}</span>
							<span className={`text-xs font-semibold ${toneClasses[chip.tone]}`}>
								{chip.level}
							</span>
						</li>
					))}
				</ul>
			</div>
		</OverviewCard>
	);
}
