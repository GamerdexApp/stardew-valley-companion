import type { Villager } from "stardew-valley-data";
import Link from "next/link";
import type { GameData } from "@/types/app";
import { villagersText } from "@/lib/messages/villagers";
import { statusChoices, statusOf } from "@/service/villagers";
import type { RelationshipStatus } from "@/service/villagers";
import { Field } from "@/comps/ui/Field";
import { Select } from "@/comps/ui/Select";

const text = villagersText.card;

interface StatusSelectProps {
	villager: Villager;
	data: GameData;
	onChange: (status: RelationshipStatus) => void;
}

/** The status of a spouse is read only, because the spouse is set on the Character tab. */
export function StatusSelect({ villager, data, onChange }: StatusSelectProps) {
	const status = statusOf(data, villager);
	const choices = statusChoices(villager);

	if (status === "married") {
		return (
			<div className="flex flex-col gap-0.5">
				<p className="text-muted text-xs">{text.married}</p>
				<Link
					href="/farm?tab=character"
					className="text-link flex min-h-11 items-center self-start text-xs font-semibold underline-offset-2 hover:underline lg:min-h-6"
				>
					{text.marriedLink}
				</Link>
			</div>
		);
	}
	if (choices.length === 1) return <p className="text-muted text-xs">{text.friendOnly}</p>;

	return (
		<Field label={text.status}>
			<Select
				value={status}
				aria-label={text.statusOf(villager.name)}
				onChange={(event) => onChange(event.target.value as RelationshipStatus)}
			>
				{choices.map((choice) => (
					<option key={choice} value={choice}>
						{villagersText.status[choice]}
					</option>
				))}
			</Select>
		</Field>
	);
}
