"use client";

import Link from "next/link";
import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { useMemoryState } from "@/lib/hooks/useMemoryState";
import { farmText } from "@/lib/messages/farm";
import {
	addAnimal,
	allSpecies,
	animalsSummary,
	emptyAnimalFilters,
	filterAnimals,
	isFilteringAnimals,
	moveAnimal,
	removeAnimal,
	setAge,
	setCracker,
	setFriendship,
	setHappiness,
} from "@/service/animals";
import type { AnimalFilters } from "@/service/animals";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { Section } from "../Section";
import { useFarmEdit } from "../useFarmEdit";
import { AddAnimalDialog } from "./AddAnimalDialog";
import { AnimalCard } from "./AnimalCard";
import { PetsSection } from "./PetsSection";

const text = farmText.animals;
const options = text.options;

const fields: FilterFieldConfig[] = [
	{
		id: "type",
		label: text.filter.type,
		options: [
			{ id: "all", label: options.allTypes },
			...allSpecies.map((species) => ({ id: species.name, label: species.name })),
		],
	},
	{
		id: "building",
		label: text.filter.building,
		hint: text.filterHint,
		options: [
			{ id: "all", label: options.allBuildings },
			{ id: "coop", label: options.coop },
			{ id: "barn", label: options.barn },
		],
	},
	{
		id: "sort",
		label: text.filter.sort,
		options: [
			{ id: "name", label: options.name },
			{ id: "friendship", label: options.friendship },
			{ id: "age", label: options.age },
		],
	},
];

export function AnimalsTab({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const { edit, editWithNote } = useFarmEdit(playthrough.id, data);
	const [filters, setFilters] = useMemoryState<AnimalFilters>(
		"farm:animals:filters",
		emptyAnimalFilters
	);
	const [adding, setAdding] = useState(false);

	const summary = animalsSummary(data);
	const shown = filterAnimals(data, filters);
	const clearFilters = () => setFilters(emptyAnimalFilters);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
				<SummaryTile label={text.tiles.animals} value={summary.animals} />
				<SummaryTile label={text.tiles.buildings} value={summary.buildings} />
				<SummaryTile label={text.tiles.pets} value={summary.pets} />
				<SummaryTile
					label={text.tiles.friendship}
					value={summary.averageFriendship}
					total={1000}
					emphasis={summary.averageFriendship >= 1000}
				/>
				<SummaryTile label={text.tiles.crackers} value={summary.crackers} />
			</div>
			<Link
				href="/farm?tab=buildings"
				className="text-link -mt-2 flex min-h-11 items-center self-start font-semibold underline-offset-2 hover:underline lg:min-h-6"
			>
				{text.tiles.buildings} · {text.tiles.openTab}
			</Link>
			<Section
				title={text.animalsSection.title}
				badge={text.animalsSection.badge(summary.animals)}
			>
				{adding && (
					<AddAnimalDialog
						data={data}
						onCancel={() => setAdding(false)}
						onAdd={(animal) => {
							edit((d) => addAnimal(d, animal, `manual-animal-${Date.now()}`));
							setAdding(false);
						}}
					/>
				)}
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
					summary={text.showing(
						shown.length,
						summary.animals,
						options[filters.sort].toLowerCase()
					)}
					flyoutTitle={text.sheetTitle}
					showLabel={text.apply(shown.length)}
					actions={
						<Button
							className="max-lg:flex-1"
							onClick={() => setAdding(true)}
							aria-haspopup="dialog"
						>
							<LuPlus size={16} aria-hidden="true" />
							{text.animalsSection.add}
						</Button>
					}
				/>
				{shown.length === 0 ? (
					<EmptyState
						title={summary.animals === 0 ? text.empty.none : text.empty.noMatch}
						description=""
						actions={
							isFilteringAnimals(filters) ? (
								<Button onClick={clearFilters}>{text.empty.clear}</Button>
							) : undefined
						}
					/>
				) : (
					<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
						{shown.map((animal) => (
							<AnimalCard
								key={animal.id}
								animal={animal}
								data={data}
								onFriendship={(value) =>
									edit((d) => setFriendship(d, animal.id, value))
								}
								onHappiness={(value) =>
									edit((d) => setHappiness(d, animal.id, value))
								}
								onAge={(value) => edit((d) => setAge(d, animal.id, value))}
								onCracker={(has) => edit((d) => setCracker(d, animal.id, has))}
								onMove={(buildingId) =>
									edit((d) => moveAnimal(d, animal.id, buildingId))
								}
								onRemove={() =>
									editWithNote(
										(d) => removeAnimal(d, animal.id),
										() => ({
											title: farmText.animals.card.removed(animal.name),
											undo: farmText.animals.card.undo,
										})
									)
								}
							/>
						))}
					</div>
				)}
			</Section>
			<PetsSection data={data} edit={edit} editWithNote={editWithNote} />
		</>
	);
}
