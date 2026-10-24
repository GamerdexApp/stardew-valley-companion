"use client";

import { useMemo } from "react";
import type { Playthrough } from "@/types/app";
import { overviewText } from "@/lib/messages/overview";
import { hero } from "@/service/overview";
import { PageHeader } from "@/comps/shell/PageHeader";
import { PlaythroughGate } from "@/comps/shell/PlaythroughGate";
import { CollectionsCard } from "./CollectionsCard";
import { CommunityCenterCard } from "./CommunityCenterCard";
import { HeroCard } from "./HeroCard";
import { MilestonesCard } from "./MilestonesCard";
import { MinesCard } from "./MinesCard";
import { PerfectionCard } from "./PerfectionCard";
import { RelationshipsCard } from "./RelationshipsCard";
import { SkillsToolsCard } from "./SkillsToolsCard";

const text = overviewText;

function OverviewContent({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const heroFigures = useMemo(() => hero(data), [data]);

	return (
		<>
			<PageHeader title={text.title} subline={text.subline} />
			<HeroCard hero={heroFigures} />
			<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
				<SkillsToolsCard data={data} />
				<CollectionsCard data={data} />
			</div>
			<RelationshipsCard data={data} />
			<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
				<PerfectionCard data={data} />
				<MilestonesCard data={data} />
			</div>
			<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
				<MinesCard data={data} />
				<CommunityCenterCard data={data} />
			</div>
		</>
	);
}

export function OverviewPage() {
	return (
		<PlaythroughGate
			title={text.title}
			subline={text.subline}
			emptyDescription={text.emptyDescription}
		>
			{(playthrough) => <OverviewContent playthrough={playthrough} />}
		</PlaythroughGate>
	);
}
