import Link from "next/link";
import { LuTrash2 } from "react-icons/lu";
import type { BuildingProgress, GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { assetPath } from "@/lib/utils/assetPath";
import { capacityOf, speciesOf } from "@/service/animals";
import {
	animalsIn,
	FARMHOUSE,
	fishName,
	infoOf,
	isAnimalHome,
	isPond,
	pondFishOptions,
	pondOf,
	SLIME_HUTCH,
	viewOf,
} from "@/service/buildings";
import { Card } from "@/comps/ui/Card";
import { ExpandableDetails } from "@/comps/ui/ExpandableDetails";
import { Field } from "@/comps/ui/Field";
import { IconButton } from "@/comps/ui/IconButton";
import { Select } from "@/comps/ui/Select";
import { ValueStepper } from "@/comps/ui/ValueStepper";

const text = farmText.buildings.card;

interface BuildingCardProps {
	building: BuildingProgress;
	label: string;
	data: GameData;
	onRemove: () => void;
	onSlimes: (count: number) => void;
	onPondFish: (fishType: number) => void;
	onPondOccupants: (count: number) => void;
}

export function BuildingCard({
	building,
	label,
	data,
	onRemove,
	onSlimes,
	onPondFish,
	onPondOccupants,
}: BuildingCardProps) {
	const view = viewOf(data, building);
	const info = infoOf(building.type);
	const pond = isPond(building) ? pondOf(data, building.id) : undefined;
	const residents = isAnimalHome(building) ? animalsIn(data, building.id) : [];
	const removable = info?.builder === "Robin" || info?.builder === "Wizard";
	const name = building.type === FARMHOUSE ? view.name : label;

	return (
		<Card className="flex flex-col gap-3 p-3">
			<div className="flex items-start gap-3">
				{view.image ? (
					<img
						loading="lazy"
						decoding="async"
						width={48}
						height={48}
						src={assetPath(view.image)}
						alt=""
						className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
					/>
				) : (
					<span aria-hidden="true" className="bg-tint size-12 shrink-0 rounded-md" />
				)}
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<span className="font-semibold">{name}</span>
					<span className="text-muted text-xs">
						{text.builderCost(view.builder, view.cost)}
					</span>
				</div>
				{removable && (
					<IconButton
						label={text.remove(name)}
						onClick={onRemove}
						className="text-danger hover:bg-tint -me-1 -mt-1"
					>
						<LuTrash2 size={18} aria-hidden="true" />
					</IconButton>
				)}
			</div>
			{building.type === FARMHOUSE && (
				<div className="flex flex-col gap-0.5">
					<p className="text-muted text-xs">{text.houseNote}</p>
					<Link
						href="/farm?tab=character"
						className="text-link flex min-h-11 items-center self-start text-xs font-semibold underline-offset-2 hover:underline lg:min-h-6"
					>
						{text.changeHouse}
					</Link>
				</div>
			)}
			{isAnimalHome(building) && (
				<div className="flex flex-col gap-1.5">
					<span className="text-sm font-medium">
						{text.housed(residents.length, capacityOf(building.type))}
					</span>
					{residents.length === 0 ? (
						<span className="text-muted text-xs">{text.noAnimals}</span>
					) : (
						<ul className="flex flex-wrap gap-1">
							{residents.map((animal) => {
								const species = speciesOf(animal.type);
								return (
									<li
										key={animal.id}
										className="border-line text-muted flex items-center gap-1 rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium"
									>
										{species && (
											<img
												loading="lazy"
												decoding="async"
												src={assetPath(species.image)}
												alt=""
												className="size-4 object-contain [image-rendering:pixelated]"
											/>
										)}
										{animal.name}
									</li>
								);
							})}
						</ul>
					)}
					<Link
						href="/farm?tab=animals"
						className="text-link flex min-h-11 items-center self-start text-xs font-semibold underline-offset-2 hover:underline lg:min-h-6"
					>
						{text.manage}
					</Link>
				</div>
			)}
			{building.type === SLIME_HUTCH && (
				<div className="flex items-center justify-between gap-3">
					<span className="text-sm font-medium">{text.slimesLabel}</span>
					<ValueStepper
						label={text.slimes(name)}
						value={building.animalCount}
						min={0}
						max={capacityOf(building.type)}
						onChange={onSlimes}
					/>
				</div>
			)}
			{pond && (
				<div className="flex flex-col gap-2">
					<Field label={text.fish(name)}>
						<Select
							value={String(pond.fishType)}
							onChange={(event) => onPondFish(Number(event.target.value))}
						>
							<option value="0">{text.noFish}</option>
							{fishName(pond.fishType) === null && pond.fishType !== 0 && (
								<option value={pond.fishType}>{`#${pond.fishType}`}</option>
							)}
							{pondFishOptions.map((option) => (
								<option key={option.type} value={option.type}>
									{option.name}
								</option>
							))}
						</Select>
					</Field>
					<div className="flex items-center justify-between gap-3">
						<span className="text-sm font-medium">{text.fishIn(name)}</span>
						<span className="flex items-center gap-2">
							<ValueStepper
								label={text.fishIn(name)}
								value={pond.currentOccupants}
								min={0}
								max={pond.maxOccupants}
								onChange={onPondOccupants}
							/>
							<span className="text-muted font-mono text-xs">
								{text.fishCount(pond.currentOccupants, pond.maxOccupants)}
							</span>
						</span>
					</div>
				</div>
			)}
			{info && (
				<ExpandableDetails showLabel={text.showDetails} hideLabel={text.hideDetails}>
					<p className="text-muted text-sm italic">{view.description}</p>
					<section className="flex flex-col gap-1.5">
						<h3 className="font-semibold">{text.buildInfo}</h3>
						<dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
							<dt className="text-muted">{text.builder}</dt>
							<dd>{info.builder}</dd>
							<dt className="text-muted">{text.cost}</dt>
							<dd className="font-mono">{info.buildCost.toLocaleString()}g</dd>
							<dt className="text-muted">{text.buildDays}</dt>
							<dd>{text.days(info.buildDays)}</dd>
							<dt className="text-muted">{text.upgradesFrom}</dt>
							<dd>{info.upgradeFrom ?? text.none}</dd>
							{info.animalCapacity ? (
								<>
									<dt className="text-muted">{text.maxOccupants}</dt>
									<dd className="font-mono">{info.animalCapacity}</dd>
								</>
							) : null}
						</dl>
					</section>
					{info.materials.length > 0 && (
						<section className="flex flex-col gap-1.5">
							<h3 className="font-semibold">{text.materials}</h3>
							<ul className="flex flex-col gap-1">
								{info.materials.map((material) => (
									<li
										key={material.id}
										className="bg-bg flex items-center justify-between gap-3 rounded-md px-3 py-1.5 text-sm"
									>
										<span>{material.item}</span>
										<span className="text-muted font-mono text-xs">
											{text.material(material.quantity)}
										</span>
									</li>
								))}
							</ul>
						</section>
					)}
				</ExpandableDetails>
			)}
		</Card>
	);
}
