"use client";

import { useMemo } from "react";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { calculatePerfection, calculatePerfectionScore } from "@/lib/pages/perfection";
import {
	CollectionsCard,
	CommunityCenterCard,
	MilestonesCard,
	MinesCard,
	PerfectionCard,
	SkillsCard,
	VillagersCard,
} from "@/comps/dashboard/cards";
import { DashboardHero } from "@/comps/dashboard/DashboardHero";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function DashboardPage() {
	const { activePlaythrough } = usePlaythrough();

	const categories = useMemo(() => {
		if (!activePlaythrough) return [];
		return calculatePerfection(activePlaythrough.data);
	}, [activePlaythrough]);

	const score = useMemo(
		() =>
			calculatePerfectionScore(
				categories,
				activePlaythrough?.data.perfectionWaiverCount ?? 0
			),
		[categories, activePlaythrough]
	);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="dashboard" />;
	}

	const { data: gameData } = activePlaythrough;

	return (
		<div className="p-6">
			<PageHeader title="Dashboard" description="Overview of your playthrough progress" />

			<div className="flex flex-col gap-6">
				<DashboardHero gameData={gameData} />

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<SkillsCard gameData={gameData} />
					<CollectionsCard gameData={gameData} />
				</div>

				<VillagersCard gameData={gameData} />

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<PerfectionCard gameData={gameData} categories={categories} score={score} />
					<CommunityCenterCard gameData={gameData} />
				</div>

				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<MinesCard gameData={gameData} />
					<MilestonesCard gameData={gameData} />
				</div>
			</div>
		</div>
	);
}
