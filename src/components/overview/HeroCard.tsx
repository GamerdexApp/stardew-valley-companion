import { LuHouse } from "react-icons/lu";
import { overviewText } from "@/lib/messages/overview";
import type { Hero } from "@/service/overview";
import { Card } from "@/comps/ui/Card";

export function HeroCard({ hero }: { hero: Hero }) {
	return (
		<Card className="flex flex-col gap-4 p-4">
			<div className="flex items-center gap-4">
				<span className="bg-track flex size-11 shrink-0 items-center justify-center rounded-md lg:size-13">
					{hero.farmIcon ? (
						<img
							src={hero.farmIcon}
							alt=""
							className="size-8 object-contain [image-rendering:pixelated] lg:size-10"
						/>
					) : (
						<LuHouse size={24} aria-hidden="true" className="text-muted" />
					)}
				</span>
				<div className="flex min-w-0 flex-col gap-1">
					<span className="text-lg font-semibold break-words">{hero.title}</span>
					<span className="flex flex-wrap items-center gap-x-3 gap-y-1">
						<span className="bg-tint text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
							{hero.seasonPill}
						</span>
						{hero.spouse && <span>{overviewText.hero.married(hero.spouse)}</span>}
					</span>
				</div>
			</div>
			<dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
				{hero.figures.map((figure) => (
					<div
						key={figure.label}
						className="bg-bg flex flex-col gap-1 rounded-md px-3 py-2.5"
					>
						<dt className="text-muted text-xs">{figure.label}</dt>
						<dd
							className={`font-mono text-base [overflow-wrap:anywhere] ${figure.tone === "primary" ? "text-primary" : "text-ink"}`}
						>
							{figure.value}
						</dd>
					</div>
				))}
			</dl>
		</Card>
	);
}
