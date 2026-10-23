"use client";

import { grandpaEvaluator } from "stardew-valley-data";
import { useMemo } from "react";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { buildGrandpaInput } from "@/lib/pages/grandpa";
import { GrandpaEvaluationSection } from "@/comps/grandpa/GrandpaEvaluationSection";
import { GrandpaHero } from "@/comps/grandpa/GrandpaHero";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function GrandpaPage() {
	const { activePlaythrough } = usePlaythrough();

	const result = useMemo(() => {
		if (!activePlaythrough) return null;
		const input = buildGrandpaInput(activePlaythrough.data);
		return grandpaEvaluator().evaluate(input);
	}, [activePlaythrough]);

	if (!activePlaythrough || !result) {
		return <NoPlaythroughFallback feature="grandpa's evaluation" />;
	}

	return (
		<div className="p-6">
			<PageHeader
				title="Grandpa's Evaluation"
				description="Year 3 farm evaluation criteria and progress"
			/>

			<div className="flex flex-col gap-6">
				<GrandpaHero result={result} />
				<GrandpaEvaluationSection gameData={activePlaythrough.data} />
			</div>
		</div>
	);
}
