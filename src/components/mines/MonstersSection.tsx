import type { GameData } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { minesText } from "@/lib/messages/mines";
import {
	ALL_LOCATIONS,
	allMonsters,
	dangerousCount,
	emptyMonsterFilters,
	filterMonsters,
	getMonsterKillCount,
	isFilteringMonsters,
	monsterLocations,
} from "@/service/mines";
import type { MonsterFilters } from "@/service/mines";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Section } from "@/comps/ui/Section";
import { MonsterCard } from "./MonsterCard";

const text = minesText.monsters;

const fields: FilterFieldConfig[] = [
	{
		id: "location",
		label: text.location,
		options: [
			{ id: ALL_LOCATIONS, label: text.allLocations },
			...monsterLocations.map((location) => ({ id: location, label: location })),
		],
	},
	{
		id: "type",
		label: text.type,
		options: (["all", "standard", "dangerous"] as const).map((id) => ({
			id,
			label: text.types[id],
		})),
	},
];

interface MonstersSectionProps {
	data: GameData;
	totalSlain: number;
	onKills: (monsterName: string, count: number) => void;
}

export function MonstersSection({ data, totalSlain, onKills }: MonstersSectionProps) {
	const [filters, setFilters] = useMemoryState<MonsterFilters>(
		"mines:filters",
		emptyMonsterFilters
	);
	const shown = filterMonsters(filters);
	const clearFilters = () => setFilters(emptyMonsterFilters);

	return (
		<Section title={text.title} badge={text.badge(totalSlain)}>
			<p className="text-muted text-sm">
				{text.description(allMonsters.length, dangerousCount(allMonsters))}
			</p>
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
				summary={text.showing(shown.length, allMonsters.length, dangerousCount(shown))}
				flyoutTitle={text.sheetTitle}
				showLabel={text.apply(shown.length)}
			/>
			{shown.length === 0 ? (
				<EmptyState
					title={text.empty}
					description=""
					actions={
						isFilteringMonsters(filters) ? (
							<Button onClick={clearFilters}>{text.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
					{shown.map((monster) => (
						<MonsterCard
							key={monster.id}
							monster={monster}
							kills={getMonsterKillCount(monster, data.monsters)}
							onKills={(count) => onKills(monster.name, count)}
						/>
					))}
				</div>
			)}
		</Section>
	);
}
