"use client";

import { useMemo } from "react";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { calculatePerfection, calculatePerfectionScore } from "@/lib/pages/perfection";
import { PerfectionHero } from "@/comps/perfection/PerfectionHero";
import { PerfectionSection } from "@/comps/perfection/PerfectionSection";
import { PerfectionWaivers } from "@/comps/perfection/PerfectionWaivers";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function PerfectionPage() {
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
		return <NoPlaythroughFallback feature="perfection tracker" />;
	}

	return (
		<div className="p-6">
			<PageHeader
				title="Perfection Tracker"
				description="Track your progress toward 100% game completion"
			/>

			<div className="flex flex-col gap-6">
				<PerfectionHero
					categories={categories}
					score={score}
					waivers={activePlaythrough.data.perfectionWaiverCount}
				/>
				<PerfectionWaivers waivers={activePlaythrough.data.perfectionWaiverCount} />
				<PerfectionSection categories={categories} />
			</div>
		</div>
	);
}
