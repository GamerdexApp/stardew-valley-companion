import type { GameLocation } from "stardew-valley-data";
import { useState } from "react";
import { townText } from "@/lib/messages/town";
import { assetPath } from "@/lib/utils/assetPath";
import { formatNumber } from "@/lib/utils/formatting";
import {
	fieldOfficeCollections,
	houseRenovations,
	houseUpgrades,
	isFieldOffice,
	materialImage,
	purchasableAnimals,
	purchasablePets,
	shopBuildings,
	shopItems,
} from "@/service/town";
import { Tabs } from "@/comps/ui/Tabs";

const text = townText.shop;
const INVENTORY_PREVIEW = 9;

function Row({
	image,
	name,
	note,
	right,
	children,
}: {
	image?: string | null;
	name: string;
	note?: string;
	right?: string;
	children?: React.ReactNode;
}) {
	return (
		<li className="border-line flex flex-col gap-1.5 rounded-md border-[1.5px] p-2">
			<div className="flex items-center gap-2">
				{image ? (
					<img
						src={assetPath(image)}
						alt=""
						width={24}
						height={24}
						className="size-6 shrink-0 object-contain [image-rendering:pixelated]"
					/>
				) : (
					<span aria-hidden="true" className="size-6 shrink-0" />
				)}
				<span className="min-w-0 flex-1 text-sm">{name}</span>
				{note && <span className="text-muted text-xs">{note}</span>}
				{right && <span className="font-mono text-xs font-medium">{right}</span>}
			</div>
			{children}
		</li>
	);
}

function Materials({ materials }: { materials: { item: string; quantity: number }[] }) {
	if (materials.length === 0) return null;
	return (
		<ul className="flex flex-wrap gap-1.5 ps-8">
			{materials.map((material) => {
				const image = materialImage(material.item);
				return (
					<li
						key={material.item}
						className="text-muted border-line flex items-center gap-1 rounded-md border-[1.5px] px-1.5 py-0.5 text-xs"
					>
						{image && (
							<img
								src={assetPath(image)}
								alt=""
								width={16}
								height={16}
								className="size-4 object-contain [image-rendering:pixelated]"
							/>
						)}
						{material.item} {text.quantity(material.quantity)}
					</li>
				);
			})}
		</ul>
	);
}

function Inventory({ shop }: { shop: string }) {
	const items = shopItems(shop);
	const [all, setAll] = useState(false);
	const shown = all ? items : items.slice(0, INVENTORY_PREVIEW);

	if (items.length === 0) return <p className="text-muted text-sm">{text.none}</p>;
	return (
		<div className="flex flex-col gap-2">
			<ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
				{shown.map((item) => (
					<Row
						key={item.name}
						image={item.image}
						name={item.name}
						note={item.season}
						right={item.price}
					/>
				))}
			</ul>
			{items.length > INVENTORY_PREVIEW && (
				<div className="flex flex-wrap items-center gap-3 text-sm">
					<span className="text-muted">{text.showing(shown.length, items.length)}</span>
					<button
						type="button"
						onClick={() => setAll(!all)}
						className="text-link flex min-h-11 items-center font-semibold underline-offset-2 hover:underline lg:min-h-6"
					>
						{all ? text.showFewer : text.showAll(items.length)}
					</button>
				</div>
			)}
		</div>
	);
}

type TabId = "inventory" | "buildings" | "farmhouse" | "animals" | "pets" | "collections";

export function ShopDetails({ location }: { location: GameLocation }) {
	const shop = location.shop!;
	const [tab, setTab] = useState<TabId>("inventory");
	const buildings = shopBuildings(shop);
	const farmhouse = shop === "carpenter-shop";
	const animals = shop === "marnie-shop";
	const fieldOffice = isFieldOffice(shop);
	const collections = fieldOffice ? fieldOfficeCollections() : [];
	const inventoryCount = fieldOffice ? 0 : shopItems(shop).length;

	const tabs: { id: TabId; label: string }[] = [
		...(fieldOffice
			? []
			: [{ id: "inventory" as const, label: text.inventory(inventoryCount) }]),
		...(buildings.length > 0
			? [{ id: "buildings" as const, label: text.buildings(buildings.length) }]
			: []),
		...(farmhouse
			? [
					{
						id: "farmhouse" as const,
						label: text.farmhouse(houseUpgrades.length + houseRenovations.length),
					},
				]
			: []),
		...(animals
			? [
					{ id: "animals" as const, label: text.animals(purchasableAnimals.length) },
					{ id: "pets" as const, label: text.pets(purchasablePets.length) },
				]
			: []),
		...(fieldOffice
			? [{ id: "collections" as const, label: text.collections(collections.length) }]
			: []),
	];
	const active = tabs.some((item) => item.id === tab) ? tab : tabs[0].id;

	return (
		<Tabs label={text.label} tabs={tabs} activeId={active} onChange={setTab}>
			<div className="pt-3">
				{active === "inventory" && <Inventory shop={shop} />}
				{active === "buildings" && (
					<ul className="flex flex-col gap-1.5">
						{buildings.map((building) => (
							<Row
								key={building.id}
								image={building.image}
								name={building.name}
								note={text.days(building.buildDays)}
								right={text.cost(formatNumber(building.buildCost))}
							>
								<Materials materials={building.materials} />
							</Row>
						))}
					</ul>
				)}
				{active === "farmhouse" && (
					<div className="flex flex-col gap-3">
						<h4 className="font-semibold">{text.upgrades(houseUpgrades.length)}</h4>
						<ul className="flex flex-col gap-1.5">
							{houseUpgrades.map((upgrade) => (
								<Row
									key={upgrade.id}
									image={upgrade.image}
									name={upgrade.name}
									right={
										upgrade.cost > 0
											? text.cost(formatNumber(upgrade.cost))
											: text.free
									}
								>
									<p className="text-muted ps-8 text-xs">{upgrade.description}</p>
									<Materials materials={upgrade.materials} />
								</Row>
							))}
						</ul>
						<h4 className="font-semibold">
							{text.renovations(houseRenovations.length)}
						</h4>
						<ul className="flex flex-col gap-1.5">
							{houseRenovations.map((renovation) => (
								<Row
									key={renovation.id}
									image={renovation.image}
									name={renovation.name}
									right={
										renovation.cost > 0
											? text.cost(formatNumber(renovation.cost))
											: text.free
									}
								>
									<p className="text-muted ps-8 text-xs">
										{renovation.description}
									</p>
								</Row>
							))}
						</ul>
					</div>
				)}
				{active === "animals" && (
					<ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
						{purchasableAnimals.map((animal) => (
							<Row
								key={animal.id}
								image={animal.image}
								name={animal.name}
								note={animal.building}
								right={text.cost(formatNumber(animal.purchasePrice!))}
							/>
						))}
					</ul>
				)}
				{active === "pets" && (
					<ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
						{purchasablePets.map((pet) => (
							<Row
								key={pet.id}
								image={pet.image}
								name={pet.variant ? `${pet.name} #${pet.variant}` : pet.name}
								right={text.cost(formatNumber(pet.purchasePrice!))}
							/>
						))}
					</ul>
				)}
				{active === "collections" && (
					<ul className="flex flex-col gap-2">
						{collections.map((collection) => (
							<Row
								key={collection.id}
								name={collection.name}
								note={collection.reward.item?.name}
								right={text.walnuts(collection.reward.goldenWalnuts)}
								image={collection.reward.item?.image}
							>
								<ul className="flex flex-wrap gap-1.5 ps-8">
									{collection.donations.map((donation) => (
										<li
											key={donation.id}
											className="text-muted border-line flex items-center gap-1 rounded-md border-[1.5px] px-1.5 py-0.5 text-xs"
										>
											<img
												src={assetPath(donation.image)}
												alt=""
												width={16}
												height={16}
												className="size-4 object-contain [image-rendering:pixelated]"
											/>
											{donation.name}
											{donation.quantity > 1
												? ` ${text.quantity(donation.quantity)}`
												: ""}
										</li>
									))}
								</ul>
							</Row>
						))}
					</ul>
				)}
			</div>
		</Tabs>
	);
}
