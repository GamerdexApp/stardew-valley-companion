import type { GameData } from "@/types/app";
import { villagersText } from "@/lib/messages/villagers";
import { assetPath } from "@/lib/utils/assetPath";
import { capitalize } from "@/lib/utils/formatting";
import { birthdaysBySeason } from "@/service/villagers";
import { Badge } from "@/comps/ui/Badge";
import { Section } from "@/comps/ui/Section";

const text = villagersText.birthdays;

export function BirthdaysSection({ data }: { data: GameData }) {
	const { season, day } = data.character.currentDate;

	return (
		<Section title={text.title} description={text.description}>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
				{birthdaysBySeason(data).map((group) => (
					<section
						key={group.id}
						aria-label={group.label}
						className="border-line flex flex-col gap-2 rounded-md border-[1.5px] p-3"
					>
						<h3 className="flex items-center justify-between font-semibold">
							{group.label}
							<span className="text-muted font-mono text-xs">
								{group.entries.length}
							</span>
						</h3>
						<ul className="flex flex-col gap-1">
							{group.entries.map(({ villager, today }) => (
								<li
									key={villager.id}
									className={`flex items-center gap-2 rounded-md px-2 py-1 ${today ? "bg-tint" : ""}`}
								>
									<img
										loading="lazy"
										decoding="async"
										src={assetPath(villager.image)}
										alt=""
										width={28}
										height={28}
										className="size-7 shrink-0 object-contain [image-rendering:pixelated]"
									/>
									<span className="min-w-0 flex-1 text-sm">{villager.name}</span>
									{today && <Badge tone="added">{text.today}</Badge>}
									<span className="text-muted font-mono text-xs">
										{text.day(villager.birthday.day)}
									</span>
								</li>
							))}
						</ul>
					</section>
				))}
			</div>
			<p className="text-muted text-xs">{text.note(capitalize(season), day)}</p>
		</Section>
	);
}
