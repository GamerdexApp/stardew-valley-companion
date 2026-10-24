"use client";

import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { gearText } from "@/lib/messages/gear";
import {
	allWeapons,
	emptyWeaponFilters,
	filterWeapons,
	isFilteringWeapons,
	weaponCount,
	weaponTypes,
} from "@/service/gear";
import type { WeaponFilters } from "@/service/gear";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Badge } from "@/comps/ui/Badge";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Section } from "@/comps/ui/Section";
import { GearCard } from "./GearCard";

const text = gearText.weapons;

const typeTone = { sword: "changed", dagger: "added", club: "warn", slingshot: "fixed" } as const;

const fields: FilterFieldConfig[] = [
	{
		id: "type",
		label: text.type,
		options: [
			{ id: "all", label: text.types.all },
			...weaponTypes.map((type) => ({
				id: type,
				label: `${text.types[type]} (${weaponCount(type)})`,
			})),
		],
	},
];

export function WeaponsTab() {
	const [filters, setFilters] = useMemoryState<WeaponFilters>("gear:weapons", emptyWeaponFilters);
	const shown = filterWeapons(filters);
	const clearFilters = () => setFilters(emptyWeaponFilters);
	const typeName =
		filters.type === "all" ? gearText.tabs.weapons.toLowerCase() : `${filters.type}s`;

	return (
		<Section title={gearText.tabs.weapons} badge={`${shown.length} shown`}>
			<FilterBlock
				fields={fields}
				values={{ ...filters }}
				onChange={(fieldId, value) => setFilters({ ...filters, [fieldId]: value })}
				onClear={clearFilters}
				search={{
					label: gearText.search("weapons"),
					value: filters.query,
					onChange: (query) => setFilters({ ...filters, query }),
				}}
				summary={gearText.showing(shown.length, allWeapons.length, "weapons")}
				flyoutTitle={text.sheetTitle}
				showLabel={text.apply(shown.length, typeName)}
			/>
			{shown.length === 0 ? (
				<EmptyState
					title={gearText.empty}
					description=""
					actions={
						isFilteringWeapons(filters) ? (
							<Button onClick={clearFilters}>{gearText.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
					{shown.map((weapon) => (
						<GearCard
							key={weapon.id}
							image={weapon.image}
							name={weapon.name}
							tag={
								<span>
									<Badge tone={typeTone[weapon.type]}>
										{text.types[weapon.type]}
									</Badge>
								</span>
							}
							stats={
								weapon.type === "slingshot"
									? []
									: [
											text.damage(weapon.damageMin, weapon.damageMax),
											text.speed(weapon.speed),
											text.level(weapon.level),
										]
							}
							lines={[weapon.obtain]}
							sellPrice={weapon.sellPrice}
						/>
					))}
				</div>
			)}
		</Section>
	);
}
