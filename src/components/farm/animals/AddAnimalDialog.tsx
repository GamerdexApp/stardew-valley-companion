"use client";

import { useState } from "react";
import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { allSpecies, capacityOf, housingFor, occupantsOf } from "@/service/animals";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { NumberInput } from "@/comps/ui/NumberInput";
import { Select } from "@/comps/ui/Select";
import { buildingLabels } from "./AnimalCard";

const text = farmText.animals.form;
const card = farmText.animals.card;

interface AddAnimalDialogProps {
	data: GameData;
	onAdd: (animal: {
		species: string;
		name: string;
		friendship: number;
		buildingId: string;
	}) => void;
	onCancel: () => void;
}

/** The state lives here and the dialog is mounted only while it is open, so each opening starts empty. */
export function AddAnimalDialog({ data, onAdd, onCancel }: AddAnimalDialogProps) {
	const [species, setSpecies] = useState(allSpecies[0].name);
	const [name, setName] = useState("");
	const [friendship, setFriendship] = useState(0);
	const [buildingId, setBuildingId] = useState("");
	const [tried, setTried] = useState(false);

	const homes = housingFor(data, species);
	const labels = buildingLabels(data);
	const open = homes.filter((home) => occupantsOf(data, home.id) < capacityOf(home.type));
	const chosen = open.some((home) => home.id === buildingId) ? buildingId : "";
	const nameMissing = name.trim() === "";

	const submit = () => {
		setTried(true);
		if (nameMissing) return;
		onAdd({ species, name, friendship, buildingId: chosen });
	};

	return (
		<Dialog
			open
			onClose={onCancel}
			title={text.title}
			description={text.hint}
			footer={
				<>
					<Button onClick={onCancel}>{text.cancel}</Button>
					<Button variant="primary" onClick={submit}>
						{text.submit}
					</Button>
				</>
			}
		>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<Field label={text.species}>
					<Select
						value={species}
						onChange={(event) => {
							setSpecies(event.target.value);
							setBuildingId("");
						}}
					>
						{allSpecies.map((item) => (
							<option key={item.id} value={item.name}>
								{item.name}
							</option>
						))}
					</Select>
				</Field>
				<Field
					label={text.name}
					error={tried && nameMissing ? text.nameRequired : undefined}
				>
					<Input
						data-autofocus
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</Field>
				<Field label={text.friendship}>
					<NumberInput value={friendship} max={1000} onChange={setFriendship} />
				</Field>
				<Field label={text.building}>
					<Select value={chosen} onChange={(event) => setBuildingId(event.target.value)}>
						<option value="">
							{open.length === 0 ? text.noBuildings : text.unhoused}
						</option>
						{open.map((home) => (
							<option key={home.id} value={home.id}>
								{card.housing(
									labels.get(home.id) ?? home.type,
									occupantsOf(data, home.id),
									capacityOf(home.type)
								)}
							</option>
						))}
					</Select>
				</Field>
			</div>
		</Dialog>
	);
}
