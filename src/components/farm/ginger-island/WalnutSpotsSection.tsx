import type { GameData } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { farmText } from "@/lib/messages/farm";
import { assetPath } from "@/lib/utils/assetPath";
import {
	ALL_LOCATIONS,
	allWalnutSpots,
	emptySpotFilters,
	filterSpots,
	isFilteringSpots,
	islandSummary,
	isSpotFound,
	spotLocations,
	WALNUT_TOTAL,
} from "@/service/gingerIsland";
import type { SpotFilters } from "@/service/gingerIsland";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { ExpandableDetails } from "@/comps/ui/ExpandableDetails";
import { Section } from "@/comps/ui/Section";
import { Switch } from "@/comps/ui/Switch";

const text = farmText.gingerIsland.spots;

const fields: FilterFieldConfig[] = [
	{
		id: "location",
		label: text.location,
		options: [
			{ id: ALL_LOCATIONS, label: text.allLocations },
			...spotLocations.map((location) => ({
				id: location.name,
				label: `${location.name} (${location.count})`,
			})),
		],
	},
	{
		id: "status",
		label: text.status,
		options: (["all", "found", "not-found"] as const).map((id) => ({
			id,
			label: text.statuses[id],
		})),
	},
];

interface WalnutSpotsSectionProps {
	data: GameData;
	onToggle: (spotId: string, found: boolean) => void;
}

export function WalnutSpotsSection({ data, onToggle }: WalnutSpotsSectionProps) {
	const [filters, setFilters] = useMemoryState<SpotFilters>(
		"farm:ginger-island:filters",
		emptySpotFilters
	);
	const shown = filterSpots(data, filters);
	const { found, spotsFound } = islandSummary(data);
	const clearFilters = () => setFilters(emptySpotFilters);

	return (
		<Section title={text.title} badge={text.badge(found, WALNUT_TOTAL)}>
			<p className="text-muted text-sm">{text.count(spotsFound, allWalnutSpots.length)}</p>
			<FilterBlock
				fields={fields}
				values={{ ...filters }}
				onChange={(fieldId, value) => setFilters({ ...filters, [fieldId]: value })}
				onClear={clearFilters}
				search={{
					label: text.search,
					value: filters.query,
					onChange: (query) => setFilters({ ...filters, query }),
				}}
				summary={text.showing(shown.length, allWalnutSpots.length)}
				flyoutTitle={text.sheetTitle}
				showLabel={text.apply(shown.length)}
			/>
			{shown.length === 0 ? (
				<EmptyState
					title={text.empty}
					description=""
					actions={
						isFilteringSpots(filters) ? (
							<Button onClick={clearFilters}>{text.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
					{shown.map((spot) => {
						const on = isSpotFound(data, spot.id);
						return (
							<Card key={spot.id} className="flex flex-col gap-2 p-3">
								<div className="flex items-start gap-3">
									<img
										loading="lazy"
										decoding="async"
										src={assetPath("images/misc/Golden Walnut.png")}
										alt=""
										width={32}
										height={32}
										className="size-8 shrink-0 object-contain [image-rendering:pixelated]"
									/>
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="font-semibold">{spot.name}</span>
										<span className="text-muted text-xs">{spot.location}</span>
									</div>
									<Switch
										checked={on}
										onChange={(checked) => onToggle(spot.id, checked)}
										label={text.switch(spot.name)}
									/>
								</div>
								{spot.amount > 1 && (
									<span className="text-kept font-mono text-xs font-medium">
										{text.amount(spot.amount)}
									</span>
								)}
								<ExpandableDetails
									showLabel={text.showHint}
									hideLabel={text.hideHint}
								>
									<p className="text-muted text-sm">{spot.hint}</p>
								</ExpandableDetails>
							</Card>
						);
					})}
				</div>
			)}
		</Section>
	);
}
