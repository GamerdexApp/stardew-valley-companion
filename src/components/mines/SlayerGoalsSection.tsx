import { LuPhone } from "react-icons/lu";
import type { GameData } from "@/types/app";
import { minesText } from "@/lib/messages/mines";
import { assetPath } from "@/lib/utils/assetPath";
import { goalProgress } from "@/service/mines";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { Section } from "@/comps/ui/Section";

const text = minesText.goals;

export function SlayerGoalsSection({ data }: { data: GameData }) {
	const progress = goalProgress(data);
	const done = progress.filter((item) => item.complete).length;

	return (
		<Section title={text.title} badge={text.badge(done, progress.length)}>
			<p className="text-muted text-sm">{text.note}</p>
			<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
				{progress.map(({ goal, kills, complete, share }) => (
					<Card
						key={goal.id}
						className={`flex flex-col gap-2 p-3 ${complete ? "border-kept" : ""}`}
					>
						<div className="flex items-start gap-3">
							{goal.reward.image ? (
								<img
									loading="lazy"
									decoding="async"
									src={assetPath(goal.reward.image)}
									alt=""
									width={32}
									height={32}
									className="size-8 shrink-0 object-contain [image-rendering:pixelated]"
								/>
							) : (
								<span
									aria-hidden="true"
									className="bg-tint text-muted flex size-8 shrink-0 items-center justify-center rounded-md"
								>
									<LuPhone size={16} />
								</span>
							)}
							<div className="flex min-w-0 flex-1 flex-col">
								<span className="font-semibold">{goal.name}</span>
								<span className="text-muted text-xs">
									{text.reward(goal.reward.name)}
								</span>
							</div>
							{complete ? (
								<Badge tone="kept">{text.complete}</Badge>
							) : (
								<span className="font-mono text-xs">
									{text.kills(kills, goal.killTarget)}
								</span>
							)}
						</div>
						<p className="text-muted text-xs">{goal.monsters.join(", ")}</p>
						<ProgressBar
							value={share}
							label={text.bar(goal.name)}
							tone={complete ? "kept" : "primary"}
						/>
					</Card>
				))}
			</div>
		</Section>
	);
}
