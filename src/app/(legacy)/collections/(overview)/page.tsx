"use client";

import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { CollectionsOverview } from "@/comps/collections/overview/CollectionsOverview";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function CollectionsPage() {
	const { activePlaythrough } = usePlaythrough();

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="collections" />;
	}

	const gameData = activePlaythrough.data;

	return (
		<div className="p-6">
			<PageHeader
				title="Collections"
				description="Track your shipped items, fish, artifacts, minerals, cooking, and crafting progress"
			/>

			<CollectionsOverview gameData={gameData} />
		</div>
	);
}
