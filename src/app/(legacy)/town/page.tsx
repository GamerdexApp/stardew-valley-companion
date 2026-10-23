"use client";

import { TownSection } from "@/comps/town/TownSection";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function TownPage() {
	return (
		<div className="p-6">
			<PageHeader
				title="Town"
				description="Locations, shops, and hours throughout the valley"
			/>

			<TownSection />
		</div>
	);
}
