"use client";

import { collectionsText } from "@/lib/messages/collections";
import { Card } from "@/comps/ui/Card";
import { Checkbox } from "@/comps/ui/Checkbox";
import { Switch } from "@/comps/ui/Switch";

const text = collectionsText.professions;

export interface ProfessionOption {
	id: string;
	label: string;
}

interface ProfessionsControlProps {
	/** The professions the playthrough has that change a price on this tab. The control hides when there are none. */
	available: ProfessionOption[];
	enabled: boolean;
	/** The ids switched on while the control is on. */
	chosen: string[];
	onEnabledChange: (enabled: boolean) => void;
	onChosenChange: (chosen: string[]) => void;
}

const list = (options: ProfessionOption[]) => options.map((option) => option.label).join(" and ");

export function ProfessionsControl({
	available,
	enabled,
	chosen,
	onEnabledChange,
	onChosenChange,
}: ProfessionsControlProps) {
	if (available.length === 0) return null;

	const toggle = (id: string) =>
		onChosenChange(
			chosen.includes(id) ? chosen.filter((other) => other !== id) : [...chosen, id]
		);

	return (
		<Card className="flex flex-col gap-2 p-3">
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 flex-col">
					<span id="profession-prices-label" className="font-medium">
						{text.title}
					</span>
					<span className="text-muted text-xs">
						{text.shows(list(available))} {text.playthroughHas(list(available))}
					</span>
				</div>
				<Switch
					checked={enabled}
					onChange={onEnabledChange}
					labelledBy="profession-prices-label"
				/>
			</div>
			{enabled && available.length > 1 && (
				<fieldset className="flex flex-wrap gap-x-5">
					<legend className="sr-only">{text.which}</legend>
					{available.map((option) => (
						<Checkbox
							key={option.id}
							label={option.label}
							checked={chosen.includes(option.id)}
							onChange={() => toggle(option.id)}
						/>
					))}
				</fieldset>
			)}
		</Card>
	);
}
