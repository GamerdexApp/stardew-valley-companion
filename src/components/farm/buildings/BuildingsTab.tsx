"use client";

import { useState } from "react";
import { LuPlus, LuSearch } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { farmText } from "@/lib/messages/farm";
import {
	addBuilding,
	buildingLabels,
	buildingsSummary,
	emptyBuildingFilters,
	filterBuildings,
	isFilteringBuildings,
	removeBuilding,
	setCount,
	setPondFish,
	setPondOccupants,
} from "@/service/buildings";
import type { BuilderFilter, BuildingFilters } from "@/service/buildings";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { Section } from "@/comps/ui/Section";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { useFarmEdit } from "../useFarmEdit";
import { AddBuildingDialog } from "./AddBuildingDialog";
import { BuildingCard } from "./BuildingCard";

const text = farmText.buildings;

export function BuildingsTab({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const { edit, editWithNote } = useFarmEdit(playthrough.id, data);
	const [filters, setFilters] = useMemoryState<BuildingFilters>(
		"farm:buildings:filters",
		emptyBuildingFilters
	);
	const [adding, setAdding] = useState(false);

	const summary = buildingsSummary(data);
	const shown = filterBuildings(data, filters);
	const labels = buildingLabels(data);
	const clearFilters = () => setFilters(emptyBuildingFilters);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
				<SummaryTile label={text.tiles.total} value={summary.total} />
				<SummaryTile label={text.tiles.robin} value={summary.robin} />
				<SummaryTile label={text.tiles.wizard} value={summary.wizard} />
				<SummaryTile label={text.tiles.animals} value={summary.animalsHoused} />
				<SummaryTile label={text.tiles.ponds} value={summary.ponds} />
				<SummaryTile label={text.tiles.fish} value={summary.fishInPonds} />
			</div>
			<Section title={text.section.title} badge={text.section.badge(summary.total)}>
				<div className="flex flex-wrap items-center gap-3">
					<div className="w-full lg:w-auto lg:flex-1">
						<Input
							type="search"
							value={filters.query}
							aria-label={text.search}
							placeholder={text.search}
							leadingIcon={<LuSearch size={16} aria-hidden="true" />}
							onChange={(event) =>
								setFilters({ ...filters, query: event.target.value })
							}
						/>
					</div>
					<SegmentedControl
						label={text.builderLabel}
						value={filters.builder}
						onChange={(builder: BuilderFilter) => setFilters({ ...filters, builder })}
						options={(["all", "Robin", "Wizard"] as const).map((id) => ({
							id,
							label: text.builders[id],
						}))}
					/>
					<Button
						className="max-lg:flex-1"
						onClick={() => setAdding(true)}
						aria-haspopup="dialog"
					>
						<LuPlus size={16} aria-hidden="true" />
						{text.section.add}
					</Button>
				</div>
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
					<span className="text-muted">
						{text.showing(shown.length, summary.total)}
						{filters.builder !== "all" && ` · ${text.farmhouseNote}`}
					</span>
					{isFilteringBuildings(filters) && (
						<Button variant="link" onClick={clearFilters}>
							{text.clear}
						</Button>
					)}
				</div>
				{shown.length === 0 ? (
					<EmptyState
						title={summary.total === 0 ? text.empty.none : text.empty.noMatch}
						description=""
						actions={
							isFilteringBuildings(filters) ? (
								<Button onClick={clearFilters}>{text.clear}</Button>
							) : undefined
						}
					/>
				) : (
					<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
						{shown.map((building) => (
							<BuildingCard
								key={building.id}
								building={building}
								label={labels.get(building.id) ?? building.type}
								data={data}
								onSlimes={(count) => edit((d) => setCount(d, building.id, count))}
								onPondFish={(fishType) =>
									edit((d) => setPondFish(d, building.id, fishType))
								}
								onPondOccupants={(count) =>
									edit((d) => setPondOccupants(d, building.id, count))
								}
								onRemove={() =>
									editWithNote(
										(d) => removeBuilding(d, building.id),
										(before, after) => {
											const unhoused = after.animals.filter(
												(animal) =>
													animal.buildingId === "" &&
													before.animals.find(
														(old) => old.id === animal.id
													)?.buildingId !== ""
											).length;
											return {
												title: text.card.removed(
													labels.get(building.id) ?? building.type,
													unhoused
												),
												undo: text.card.undo,
											};
										}
									)
								}
							/>
						))}
					</div>
				)}
			</Section>
			{adding && (
				<AddBuildingDialog
					data={data}
					onClose={() => setAdding(false)}
					onAdd={(type) =>
						edit((d) =>
							addBuilding(
								d,
								type,
								`manual-${type.toLowerCase().replace(/\W+/g, "-")}-${Date.now()}`
							)
						)
					}
				/>
			)}
		</>
	);
}
