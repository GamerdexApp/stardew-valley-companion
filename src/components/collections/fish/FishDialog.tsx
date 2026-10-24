"use client";

import type { Fish } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import type { BonusResult } from "@/lib/utils/professionPrices";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Switch } from "@/comps/ui/Switch";
import { EnergyHealthGrid } from "../shared/EnergyHealthGrid";
import { QualityPrices } from "../shared/QualityPrices";
import { SeasonChips } from "../shared/SeasonChips";
import { DifficultyBar } from "./DifficultyBar";

const text = collectionsText.fish;
const copy = text.dialog;

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="bg-bg flex flex-col gap-1 rounded-md px-3 py-2.5">
			<SectionLabel className="text-muted">{label}</SectionLabel>
			<div className="flex flex-wrap gap-1 font-medium">{children}</div>
		</div>
	);
}

interface FishDialogProps {
	fish: Fish | null;
	caught: boolean;
	bonus: BonusResult | null;
	onCaughtChange: (caught: boolean) => void;
	onClose: () => void;
}

export function FishDialog({ fish, caught, bonus, onCaughtChange, onClose }: FishDialogProps) {
	const isRod = fish?.catchType === "rod";
	const hasEnergy =
		fish?.energyHealth &&
		((fish.energyHealth.energy ?? 0) > 0 || (fish.energyHealth.health ?? 0) > 0);

	return (
		<Dialog
			open={fish !== null}
			onClose={onClose}
			title={fish?.name ?? ""}
			footer={<Button onClick={onClose}>{copy.close}</Button>}
		>
			{fish && (
				<>
					<div className="flex items-center gap-3">
						<img
							loading="lazy"
							decoding="async"
							src={assetPath(fish.image)}
							alt=""
							className="size-14 shrink-0 object-contain [image-rendering:pixelated]"
						/>
						<div className="flex min-w-0 flex-1 flex-col gap-1 break-words">
							<span className="flex flex-wrap items-center gap-2 text-xs font-medium">
								<span
									className={`border-line rounded-md border-[1.5px] px-1.5 py-0.5 ${isRod ? "text-warn" : "text-added"}`}
								>
									{isRod ? text.card.rod : text.card.crabPot}
								</span>
								<span className="text-muted">{fish.location}</span>
							</span>
							<span className="flex items-center gap-3">
								<span
									className={`text-xs font-medium ${caught ? "text-kept" : "text-muted"}`}
								>
									{caught ? text.card.caught : text.card.notCaught}
								</span>
								<Switch
									checked={caught}
									onChange={onCaughtChange}
									label={text.card.switchLabel(fish.name)}
								/>
							</span>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<Tile label={copy.seasons}>
							{fish.seasons.length === 0 ? (
								copy.allSeasons
							) : (
								<SeasonChips seasons={fish.seasons} />
							)}
						</Tile>
						{fish.location && <Tile label={copy.location}>{fish.location}</Tile>}
						{isRod && fish.weather && (
							<Tile label={copy.weather}>
								{text.weather[fish.weather as keyof typeof text.weather] ??
									fish.weather}
							</Tile>
						)}
						{isRod && fish.time && <Tile label={copy.time}>{fish.time}</Tile>}
					</div>
					{isRod && fish.difficulty != null && (
						<DifficultyBar
							value={fish.difficulty}
							ariaLabel={text.card.difficultyOf(fish.name)}
							label={copy.difficulty}
							showLevel
						/>
					)}
					<section className="flex flex-col gap-2">
						<h3 className="font-semibold">{copy.sellPrice}</h3>
						<QualityPrices
							price={fish.sellPrice}
							maxQuality={fish.maxQuality}
							bonus={bonus}
						/>
					</section>
					{hasEnergy && (
						<section className="flex flex-col gap-2">
							<h3 className="font-semibold">{copy.energyHealth}</h3>
							<EnergyHealthGrid
								energy={fish.energyHealth!.energy ?? 0}
								health={fish.energyHealth!.health ?? 0}
								maxQuality={fish.maxQuality}
							/>
						</section>
					)}
					{(fish.roe !== null || fish.canSmoke) && (
						<section className="flex flex-col gap-2">
							<h3 className="font-semibold">{copy.properties}</h3>
							<ul className="flex flex-wrap gap-2">
								{fish.roe !== null && (
									<li className="border-line rounded-md border-[1.5px] px-2.5 py-1 text-xs font-medium">
										{fish.roe === "caviar"
											? copy.producesCaviar
											: copy.producesRoe}
									</li>
								)}
								{fish.canSmoke && (
									<li className="border-line rounded-md border-[1.5px] px-2.5 py-1 text-xs font-medium">
										{copy.smokeable}
									</li>
								)}
							</ul>
						</section>
					)}
					{fish.fishPond && fish.fishPond.produce.length > 0 && (
						<section className="flex flex-col gap-2">
							<h3 className="font-semibold">{copy.fishPond}</h3>
							<ul className="flex flex-col gap-1.5">
								{fish.fishPond.produce.map((produce, index) => (
									<li
										key={index}
										className="bg-bg flex items-center justify-between gap-3 rounded-md px-3 py-2"
									>
										<span className="font-medium">{produce.product}</span>
										<span className="text-muted text-xs">
											{produce.minPopulation === 0
												? copy.anyPopulation
												: copy.population(produce.minPopulation)}
										</span>
									</li>
								))}
							</ul>
						</section>
					)}
				</>
			)}
		</Dialog>
	);
}
