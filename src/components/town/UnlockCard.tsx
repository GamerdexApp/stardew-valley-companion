import { townText } from "@/lib/messages/town";
import type { Unlock } from "@/service/town";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const text = townText.unlocks;

interface UnlockCardProps {
	title: string;
	note: string;
	unlocks: Unlock[];
	onLabel: string;
	offLabel: string;
}

export function UnlockCard({ title, note, unlocks, onLabel, offLabel }: UnlockCardProps) {
	const done = unlocks.filter((unlock) => unlock.on).length;

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-baseline justify-between gap-3">
				<SectionLabel className="text-muted">{title}</SectionLabel>
				<span className="font-mono font-medium">{text.count(done, unlocks.length)}</span>
			</div>
			<ProgressBar
				value={unlocks.length > 0 ? done / unlocks.length : 0}
				label={text.bar(title)}
			/>
			<ul className="flex flex-col gap-1">
				{unlocks.map((unlock) => (
					<li key={unlock.name} className="flex min-h-8 items-center gap-2">
						<span className="flex min-w-0 flex-1 flex-col">
							<span className="text-sm font-medium">{unlock.name}</span>
							<span className="text-muted text-xs">{unlock.via}</span>
						</span>
						<Badge tone={unlock.on ? "kept" : "locked"}>
							{unlock.on ? onLabel : offLabel}
						</Badge>
					</li>
				))}
			</ul>
			<p className="text-muted text-xs">{note}</p>
		</Card>
	);
}
