"use client";

import { useState } from "react";
import { LuPlus, LuStar, LuTrash2 } from "react-icons/lu";
import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { assetPath } from "@/lib/utils/assetPath";
import {
	addPet,
	canBeStarter,
	FRIENDSHIP_STEP,
	hasFriendship,
	MAX_FRIENDSHIP,
	PET_TYPES,
	petImage,
	removePet,
	setPetFriendship,
	setStarterPet,
	variantsOf,
} from "@/service/animals";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Dialog } from "@/comps/ui/Dialog";
import { Field } from "@/comps/ui/Field";
import { IconButton } from "@/comps/ui/IconButton";
import { Input } from "@/comps/ui/Input";
import { NumberInput } from "@/comps/ui/NumberInput";
import { NumberStepper } from "@/comps/ui/NumberStepper";
import { Section } from "@/comps/ui/Section";
import { Select } from "@/comps/ui/Select";
import { Switch } from "@/comps/ui/Switch";
import type { EditNote } from "../useFarmEdit";

const text = farmText.animals.pets;

interface PetsSectionProps {
	data: GameData;
	edit: (change: (current: GameData) => GameData) => void;
	editWithNote: EditNote;
}

/** The state lives here and the dialog is mounted only while it is open, so each opening starts empty. */
function AddPetDialog({
	onAdd,
	onCancel,
}: {
	onAdd: (pet: {
		type: string;
		name: string;
		breed: string;
		friendship: number;
		starter: boolean;
	}) => void;
	onCancel: () => void;
}) {
	const [type, setType] = useState<string>(PET_TYPES[0]);
	const [name, setName] = useState("");
	const [breed, setBreed] = useState("1");
	const [friendship, setFriendship] = useState(0);
	const [starter, setStarter] = useState(false);
	const [tried, setTried] = useState(false);
	const variants = variantsOf(type);
	const chosenBreed = variants.some((variant) => variant.breed === breed)
		? breed
		: variants[0].breed;
	const nameMissing = name.trim() === "";
	const submit = () => {
		setTried(true);
		if (nameMissing) return;
		onAdd({ type, name, breed: chosenBreed, friendship, starter });
	};

	return (
		<Dialog
			open
			onClose={onCancel}
			title={text.form.title}
			footer={
				<>
					<Button onClick={onCancel}>{text.form.cancel}</Button>
					<Button variant="primary" onClick={submit}>
						{text.form.submit}
					</Button>
				</>
			}
		>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<Field label={text.form.type}>
					<Select
						value={type}
						onChange={(event) => {
							setType(event.target.value);
							setBreed(variantsOf(event.target.value)[0].breed);
							if (!canBeStarter(event.target.value)) setStarter(false);
						}}
					>
						{PET_TYPES.map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</Select>
				</Field>
				<Field
					label={text.form.name}
					error={tried && nameMissing ? text.form.nameRequired : undefined}
				>
					<Input
						data-autofocus
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</Field>
				{type !== "Horse" && (
					<Field label={text.form.friendship}>
						<NumberInput value={friendship} max={1000} onChange={setFriendship} />
					</Field>
				)}
			</div>
			{variants.length > 1 && (
				<fieldset className="flex flex-col gap-1.5">
					<legend className="font-medium">{text.form.variant}</legend>
					<div className="flex flex-wrap gap-2">
						{variants.map((variant) => (
							<label
								key={variant.breed}
								className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border-[1.5px] px-2 py-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-(--ring) ${
									variant.breed === chosenBreed
										? "border-primary bg-tint"
										: "border-line bg-surface"
								}`}
							>
								<input
									type="radio"
									name="pet-variant"
									value={variant.breed}
									checked={variant.breed === chosenBreed}
									onChange={() => setBreed(variant.breed)}
									className="sr-only"
								/>
								<img
									loading="lazy"
									decoding="async"
									src={assetPath(variant.image)}
									alt=""
									className="size-8 object-contain [image-rendering:pixelated]"
								/>
								<span className="text-xs">{variant.label}</span>
							</label>
						))}
					</div>
				</fieldset>
			)}
			{canBeStarter(type) && (
				<div className="flex flex-col gap-1">
					<span className="flex items-center gap-3">
						<Switch checked={starter} onChange={setStarter} label={text.form.starter} />
						<span className="font-medium">{text.form.starter}</span>
					</span>
					<span className="text-muted text-xs">{text.form.starterNote}</span>
				</div>
			)}
		</Dialog>
	);
}

export function PetsSection({ data, edit, editWithNote }: PetsSectionProps) {
	const [adding, setAdding] = useState(false);

	return (
		<Section title={text.title} badge={text.badge(data.pets.length)}>
			<div className="flex justify-end">
				<Button
					className="max-lg:flex-1"
					onClick={() => setAdding(true)}
					aria-haspopup="dialog"
				>
					<LuPlus size={16} aria-hidden="true" />
					{text.add}
				</Button>
			</div>
			{adding && (
				<AddPetDialog
					onCancel={() => setAdding(false)}
					onAdd={(pet) => {
						edit((d) => addPet(d, pet));
						setAdding(false);
					}}
				/>
			)}
			{data.pets.length === 0 && <p className="text-muted">{text.empty}</p>}
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
				{data.pets.map((pet, index) => (
					<Card key={index} className="flex flex-col gap-3 p-3">
						<div className="flex items-start gap-3">
							<img
								loading="lazy"
								decoding="async"
								src={assetPath(petImage(pet))}
								alt=""
								className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
							/>
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="flex flex-wrap items-center gap-2">
									<span className="font-semibold">{pet.name}</span>
									{pet.starter && (
										<span className="text-changed flex items-center gap-1 text-xs font-medium">
											<LuStar size={12} aria-hidden="true" />
											{text.card.starter}
										</span>
									)}
								</span>
								<span className="text-muted text-xs">{pet.type}</span>
							</div>
							<IconButton
								label={text.card.remove(pet.name)}
								className="text-danger hover:bg-tint -me-1 -mt-1"
								onClick={() =>
									editWithNote(
										(d) => removePet(d, index),
										() => ({
											title: text.card.removed(pet.name),
											undo: text.card.undo,
										})
									)
								}
							>
								<LuTrash2 size={18} aria-hidden="true" />
							</IconButton>
						</div>
						{hasFriendship(pet) ? (
							<NumberStepper
								step={FRIENDSHIP_STEP}
								max={MAX_FRIENDSHIP}
								value={pet.friendship ?? 0}
								label={text.card.friendship(pet.name)}
								raiseLabel={text.card.raise(pet.name)}
								lowerLabel={text.card.lower(pet.name)}
								onChange={(value) => edit((d) => setPetFriendship(d, index, value))}
							/>
						) : (
							<p className="text-muted text-xs">{text.card.noFriendship}</p>
						)}
						{canBeStarter(pet.type) && (
							<div className="flex flex-col gap-1">
								<span className="flex items-center gap-3">
									<Switch
										checked={pet.starter}
										onChange={(value) =>
											edit((d) => setStarterPet(d, index, value))
										}
										label={text.card.starterLabel(pet.name)}
									/>
									<span className="text-sm">{text.form.starter}</span>
								</span>
								<span className="text-muted text-xs">{text.card.starterNote}</span>
							</div>
						)}
					</Card>
				))}
			</div>
		</Section>
	);
}
