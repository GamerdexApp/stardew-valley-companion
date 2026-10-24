import { LuHeart, LuTrash2 } from "react-icons/lu";
import type { FarmAnimalProgress, GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { assetPath } from "@/lib/utils/assetPath";
import {
	capacityOf,
	FRIENDSHIP_STEP,
	heartsOf,
	housingFor,
	MAX_FRIENDSHIP,
	MAX_HAPPINESS,
	MAX_HEARTS,
	occupantsOf,
	produceStatus,
	speciesOf,
} from "@/service/animals";
import { buildingLabels } from "@/service/buildings";
import { Card } from "@/comps/ui/Card";
import { ExpandableDetails } from "@/comps/ui/ExpandableDetails";
import { Field } from "@/comps/ui/Field";
import { IconButton } from "@/comps/ui/IconButton";
import { NumberInput } from "@/comps/ui/NumberInput";
import { NumberStepper } from "@/comps/ui/NumberStepper";
import { Select } from "@/comps/ui/Select";
import { Switch } from "@/comps/ui/Switch";

const text = farmText.animals.card;

interface AnimalCardProps {
	animal: FarmAnimalProgress;
	data: GameData;
	onFriendship: (value: number) => void;
	onHappiness: (value: number) => void;
	onAge: (value: number) => void;
	onCracker: (has: boolean) => void;
	onMove: (buildingId: string) => void;
	onRemove: () => void;
}

export function AnimalCard({
	animal,
	data,
	onFriendship,
	onHappiness,
	onAge,
	onCracker,
	onMove,
	onRemove,
}: AnimalCardProps) {
	const species = speciesOf(animal.type);
	const hearts = heartsOf(animal.friendship);
	const labels = buildingLabels(data);
	const homes = housingFor(data, animal.type);
	const home = data.buildings.find((building) => building.id === animal.buildingId);
	const status = species ? produceStatus(species, animal.age) : null;

	return (
		<Card className="flex flex-col gap-3 p-3">
			<div className="flex items-start gap-3">
				{species && (
					<img
						loading="lazy"
						decoding="async"
						src={assetPath(species.image)}
						alt=""
						className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
					/>
				)}
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="font-semibold">{animal.name}</span>
					<span className="text-muted text-xs">
						{text.speciesIn(animal.type, home?.type ?? "")}
					</span>
					<span
						className="flex items-center gap-0.5"
						role="img"
						aria-label={text.hearts(hearts)}
					>
						{Array.from({ length: MAX_HEARTS }).map((_, index) => (
							<LuHeart
								key={index}
								size={14}
								aria-hidden="true"
								className={
									index < hearts ? "fill-danger text-danger" : "text-muted"
								}
							/>
						))}
					</span>
				</div>
				<IconButton
					label={text.remove(animal.name)}
					onClick={onRemove}
					className="text-danger hover:bg-tint -me-1 -mt-1"
				>
					<LuTrash2 size={18} aria-hidden="true" />
				</IconButton>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
				<NumberStepper
					step={FRIENDSHIP_STEP}
					max={MAX_FRIENDSHIP}
					value={animal.friendship}
					label={text.friendship(animal.name)}
					raiseLabel={text.raise(animal.name)}
					lowerLabel={text.lower(animal.name)}
					onChange={onFriendship}
				/>
				<span className="flex items-center gap-3">
					<Switch
						checked={animal.hasAnimalCracker}
						onChange={onCracker}
						label={text.crackerLabel(animal.name)}
					/>
					<span
						className={`text-xs font-medium ${animal.hasAnimalCracker ? "text-kept" : "text-muted"}`}
					>
						{text.cracker}
					</span>
				</span>
			</div>
			<Field label={text.housedIn(animal.name)}>
				<Select value={animal.buildingId} onChange={(event) => onMove(event.target.value)}>
					<option value="">{text.unhoused}</option>
					{homes.map((building) => {
						const full =
							occupantsOf(data, building.id) >= capacityOf(building.type) &&
							building.id !== animal.buildingId;
						return (
							<option key={building.id} value={building.id} disabled={full}>
								{text.housing(
									labels.get(building.id) ?? building.type,
									occupantsOf(data, building.id),
									capacityOf(building.type)
								)}
							</option>
						);
					})}
				</Select>
			</Field>
			<div className="grid grid-cols-2 gap-3">
				<Field label={text.ageLabel}>
					<NumberInput
						aria-label={text.age(animal.name)}
						value={animal.age}
						onChange={onAge}
					/>
				</Field>
				<Field label={text.happinessLabel}>
					<NumberInput
						aria-label={text.happiness(animal.name)}
						value={animal.happiness}
						max={MAX_HAPPINESS}
						onChange={onHappiness}
					/>
				</Field>
			</div>
			{species && status && (
				<p className="text-muted text-xs">
					{status.ready
						? text.produces(species.produce.name, species.produce.sellPrice)
						: text.growing(status.daysLeft)}
				</p>
			)}
			{species && (
				<ExpandableDetails showLabel={text.showDetails} hideLabel={text.hideDetails}>
					<dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
						<dt className="text-muted">{text.daysToProduce}</dt>
						<dd className="font-mono">{species.daysToProduce}</dd>
						<dt className="text-muted">{text.purchasePrice}</dt>
						<dd className="font-mono">
							{species.purchasePrice === null
								? text.notSold
								: `${species.purchasePrice.toLocaleString()}g`}
						</dd>
						<dt className="text-muted">{text.harvestMethod}</dt>
						<dd>{text.harvest[species.harvestMethod as keyof typeof text.harvest]}</dd>
						{species.deluxeProduce && (
							<>
								<dt className="text-muted">{text.deluxeProduce}</dt>
								<dd>
									{species.deluxeProduce.name},{" "}
									{species.deluxeProduce.sellPrice.toLocaleString()}g
								</dd>
							</>
						)}
					</dl>
				</ExpandableDetails>
			)}
		</Card>
	);
}
