"use client";

import { useId } from "react";
import type { Playthrough } from "@/types/app";
import { formatDate } from "@/lib/format";
import { playthroughsText } from "@/lib/messages/playthroughs";
import { describeFarm, formatGameDate } from "@/service/playthroughList";
import { Badge } from "@/comps/ui/Badge";
import { Button, ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";

const text = playthroughsText.card;

interface PlaythroughCardProps {
	playthrough: Playthrough;
	percent: number;
	isActive: boolean;
	onSetActive: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

export function PlaythroughCard({
	playthrough,
	percent,
	isActive,
	onSetActive,
	onEdit,
	onDelete,
}: PlaythroughCardProps) {
	const titleId = useId();
	const farm = describeFarm(playthrough);

	return (
		<Card
			role="group"
			aria-labelledby={titleId}
			highlighted={isActive}
			className="flex flex-col gap-3 p-4"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 flex-col">
					<h2 id={titleId} className="truncate text-lg font-semibold">
						{playthrough.name}
					</h2>
					{farm && <span className="text-muted truncate">{farm}</span>}
				</div>
				{isActive && <Badge tone="kept">{text.active}</Badge>}
			</div>
			<div className="bg-bg flex flex-col gap-1.5 rounded-md px-3 py-2.5">
				<div className="flex items-center justify-between gap-3">
					<span className="font-semibold">{formatGameDate(playthrough)}</span>
					<Badge tone="locked">{playthrough.platform ?? text.notSet}</Badge>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex-1">
						<ProgressBar value={percent / 100} label={text.perfection} />
					</div>
					<span className="font-mono text-xs">{percent}%</span>
				</div>
			</div>
			{playthrough.description && (
				<p className="text-muted line-clamp-2">{playthrough.description}</p>
			)}
			<p className="text-muted flex flex-col text-xs">
				<span>{text.created(formatDate(playthrough.createdAt))}</span>
				<span>{text.lastModified(formatDate(playthrough.lastModified))}</span>
			</p>
			<div className="flex flex-wrap gap-2">
				{isActive ? (
					<ButtonLink
						href="/overview"
						variant="primary"
						className="max-sm:basis-full sm:flex-1"
					>
						{text.openOverview}
					</ButtonLink>
				) : (
					<Button
						variant="primary"
						className="max-sm:basis-full sm:flex-1"
						onClick={onSetActive}
					>
						{text.setActive}
					</Button>
				)}
				<Button className="max-sm:flex-1" onClick={onEdit}>
					{text.edit}
				</Button>
				<Button variant="danger" className="max-sm:flex-1" onClick={onDelete}>
					{text.delete}
				</Button>
			</div>
		</Card>
	);
}
