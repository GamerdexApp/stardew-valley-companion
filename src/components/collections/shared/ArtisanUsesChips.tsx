import type { ArtisanUses } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";

const labels = collectionsText.farmShared.artisanUses;

/** The artisan goods an item can be made into. Renders nothing when it has none. */
export function ArtisanUsesChips({ uses }: { uses: ArtisanUses }) {
	const keys = (Object.keys(labels) as (keyof ArtisanUses)[]).filter((key) => uses[key]);
	if (keys.length === 0) return null;
	return (
		<ul className="flex flex-wrap gap-1">
			{keys.map((key) => (
				<li
					key={key}
					className="border-line text-added rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium"
				>
					{labels[key]}
				</li>
			))}
		</ul>
	);
}
