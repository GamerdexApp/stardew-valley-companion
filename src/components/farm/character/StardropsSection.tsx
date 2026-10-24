import { starDrops } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { assetPath } from "@/lib/utils/assetPath";
import { setStardrop } from "@/service/character";
import { Card } from "@/comps/ui/Card";
import { Section } from "@/comps/ui/Section";
import { Switch } from "@/comps/ui/Switch";

const text = farmText.character.stardrops;
const allStardrops = starDrops().get();

interface StardropsSectionProps {
	data: GameData;
	edit: (change: (current: GameData) => GameData) => void;
}

export function StardropsSection({ data, edit }: StardropsSectionProps) {
	const collected = allStardrops.filter((drop) => data.stardrops[drop.id] === true).length;

	return (
		<Section title={text.title} badge={text.collected(collected, allStardrops.length)}>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
				{allStardrops.map((drop) => {
					const has = data.stardrops[drop.id] === true;
					return (
						<Card
							key={drop.id}
							highlighted={has}
							className={`flex items-start gap-3 p-3 ${has ? "bg-tint" : ""}`}
						>
							<img
								src={assetPath(drop.image)}
								alt=""
								className={`size-10 shrink-0 object-contain [image-rendering:pixelated] ${has ? "" : "opacity-50 grayscale"}`}
							/>
							<div className="flex min-w-0 flex-1 flex-col gap-0.5">
								<span className="font-semibold">{drop.name}</span>
								<span className="text-muted text-xs">{drop.description}</span>
							</div>
							<div className="flex shrink-0 flex-col items-end gap-1">
								<Switch
									checked={has}
									onChange={(value) =>
										edit((d) => setStardrop(d, drop.id, value))
									}
									label={text.switchLabel(drop.name)}
								/>
								<span
									className={`text-xs font-medium ${has ? "text-kept" : "text-muted"}`}
								>
									{has ? text.collectedLabel : text.notCollected}
								</span>
							</div>
						</Card>
					);
				})}
			</div>
		</Section>
	);
}
