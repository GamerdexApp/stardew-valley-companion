"use client";

import { maps } from "stardew-valley-data";
import { useState } from "react";
import type { Platform } from "@/types/app";
import { newPlaythroughText } from "@/lib/messages/newPlaythrough";
import type { BuildForm } from "@/service/newPlaythrough";
import { FARM_TYPES } from "@/data/constants/farms";
import { PLATFORMS } from "@/data/constants/platforms";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { Select } from "@/comps/ui/Select";

const text = newPlaythroughText.character;

const descriptions: Record<number, string> = Object.fromEntries(
	maps()
		.get()
		.map((map, index) => [
			Number.isFinite(Number(map.id)) ? Number(map.id) : index,
			map.description,
		])
);

type Touched = Partial<Record<"name" | "farmName" | "platform", boolean>>;

const RequiredMark = () => (
	<span className="text-muted ms-auto font-mono text-xs uppercase">Required</span>
);

export function CharacterStep({
	form,
	onChange,
}: {
	form: BuildForm;
	onChange: (form: BuildForm) => void;
}) {
	const [touched, setTouched] = useState<Touched>({});
	const touch = (field: keyof Touched) =>
		setTouched((current) => ({ ...current, [field]: true }));

	return (
		<div className="grid gap-4 lg:max-w-xl">
			<Field
				label={text.nameLabel}
				labelAction={<RequiredMark />}
				error={touched.name && form.name.trim() === "" ? text.nameError : undefined}
			>
				<Input
					placeholder={text.namePlaceholder}
					value={form.name}
					onBlur={() => touch("name")}
					onChange={(event) => onChange({ ...form, name: event.target.value })}
				/>
			</Field>
			<Field
				label={text.farmLabel}
				labelAction={<RequiredMark />}
				error={touched.farmName && form.farmName.trim() === "" ? text.farmError : undefined}
			>
				<Input
					placeholder={text.farmPlaceholder}
					value={form.farmName}
					onBlur={() => touch("farmName")}
					onChange={(event) => onChange({ ...form, farmName: event.target.value })}
				/>
			</Field>
			<Field label={text.characterLabel} optional hint={text.characterHint}>
				<Input
					value={form.characterName}
					onChange={(event) => onChange({ ...form, characterName: event.target.value })}
				/>
			</Field>
			<Field label={text.farmTypeLabel} hint={descriptions[form.farmType]}>
				<Select
					value={form.farmType}
					onChange={(event) =>
						onChange({ ...form, farmType: Number(event.target.value) })
					}
				>
					{FARM_TYPES.map((farmType) => (
						<option key={farmType.value} value={farmType.value}>
							{farmType.label}
						</option>
					))}
				</Select>
			</Field>
			<Field
				label={text.platformLabel}
				labelAction={<RequiredMark />}
				hint={text.platformHelp}
				error={touched.platform && form.platform === "" ? text.platformError : undefined}
			>
				<Select
					value={form.platform}
					onBlur={() => touch("platform")}
					onChange={(event) =>
						onChange({ ...form, platform: event.target.value as Platform | "" })
					}
				>
					<option value="">{text.platformPlaceholder}</option>
					{PLATFORMS.map((platform) => (
						<option key={platform} value={platform}>
							{platform}
						</option>
					))}
				</Select>
			</Field>
		</div>
	);
}
