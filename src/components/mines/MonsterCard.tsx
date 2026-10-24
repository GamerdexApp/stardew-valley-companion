import type { Monster } from "stardew-valley-data";
import { minesText } from "@/lib/messages/mines";
import { assetPath } from "@/lib/utils/assetPath";
import { lootOf, MAX_KILLS } from "@/service/mines";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { ExpandableDetails } from "@/comps/ui/ExpandableDetails";
import { NumberStepper } from "@/comps/ui/NumberStepper";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const text = minesText.monsters;

interface MonsterCardProps {
	monster: Monster;
	kills: number;
	onKills: (count: number) => void;
}

export function MonsterCard({ monster, kills, onKills }: MonsterCardProps) {
	const loot = lootOf(monster);
	const stats = [
		{ label: text.hp, value: monster.hp },
		{ label: text.damage, value: monster.damage },
		{ label: text.speed, value: monster.speed },
		{ label: text.xp, value: monster.xp },
	];

	return (
		<Card className="flex flex-col gap-3 p-3">
			<div className="flex items-start gap-3">
				<img
					loading="lazy"
					decoding="async"
					src={assetPath(monster.image)}
					alt=""
					width={40}
					height={40}
					className="size-10 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<span className="font-semibold">{monster.name}</span>
					<span className="text-muted font-mono text-xs">{text.slain(kills)}</span>
				</div>
				{monster.dangerous && <Badge tone="warn">{text.dangerous}</Badge>}
			</div>
			<NumberStepper
				step={1}
				max={MAX_KILLS}
				value={kills}
				label={text.killsLabel(monster.name)}
				raiseLabel={text.raise(monster.name)}
				lowerLabel={text.lower(monster.name)}
				onChange={onKills}
			/>
			<ul className="flex flex-wrap gap-1">
				{monster.locations.map((location) => (
					<li
						key={location}
						className="border-line text-muted rounded-md border-[1.5px] px-1.5 py-0.5 text-xs"
					>
						{location}
					</li>
				))}
			</ul>
			<span className="text-muted font-mono text-xs">
				{text.stats(monster.hp, monster.damage, monster.xp)}
			</span>
			<ExpandableDetails showLabel={text.showDetails} hideLabel={text.hideDetails}>
				{monster.dangerous && (
					<p className="text-warn text-sm font-medium">{text.dangerousMode}</p>
				)}
				<section className="flex flex-col gap-1.5">
					<SectionLabel className="text-muted">{text.standardStats}</SectionLabel>
					<dl className="grid grid-cols-4 gap-2 text-sm">
						{stats.map((stat) => (
							<div key={stat.label} className="flex flex-col">
								<dt className="text-muted text-xs">{stat.label}</dt>
								<dd className="font-mono">{stat.value}</dd>
							</div>
						))}
					</dl>
				</section>
				<section className="flex flex-col gap-1.5">
					<SectionLabel className="text-muted">{text.loot}</SectionLabel>
					{loot.length === 0 ? (
						<p className="text-muted text-sm">{text.noLoot}</p>
					) : (
						<ul className="flex flex-col gap-1">
							{loot.map((item) => (
								<li
									key={item.id}
									className="bg-bg flex items-center gap-2 rounded-md px-3 py-1.5 text-sm"
								>
									<img
										loading="lazy"
										decoding="async"
										src={assetPath(item.image)}
										alt=""
										width={20}
										height={20}
										className="size-5 shrink-0 object-contain [image-rendering:pixelated]"
									/>
									<span className="flex-1">{item.name}</span>
									<span className="text-muted font-mono text-xs">
										{text.sellPrice(item.sellPrice)}
									</span>
								</li>
							))}
						</ul>
					)}
				</section>
			</ExpandableDetails>
		</Card>
	);
}
