"use client";

import { useState } from "react";
import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { assetPath } from "@/lib/utils/assetPath";
import { isUpgrading, levelDots, levelLabel, toolEntries } from "@/service/tools";
import type { ToolEntry } from "@/service/tools";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Select } from "@/comps/ui/Select";
import { Section } from "../Section";
import { ToolPanelDialog } from "./ToolPanelDialog";

const text = farmText.character.tools;

const DOT_TONES = ["bg-muted", "bg-warn", "bg-added", "bg-changed", "bg-fixed"];

interface ToolsSectionProps {
	data: GameData;
	edit: (change: (current: GameData) => GameData) => void;
}

function ToolTile({
	entry,
	data,
	edit,
	onOpen,
}: {
	entry: ToolEntry;
	data: GameData;
	edit: ToolsSectionProps["edit"];
	onOpen: () => void;
}) {
	const value = entry.value(data);
	const image = entry.imageOf(value);
	const dots = levelDots(entry, value);
	const owned =
		entry.options.find((option) => option.value === value)?.value !== undefined && value >= 0;

	return (
		<Card className="relative flex flex-col items-center gap-2 p-3 text-center">
			{isUpgrading(data, entry) && (
				<span className="border-line text-changed absolute end-2 top-2 rounded-md border-[1.5px] px-1.5 py-0.5 text-[11px] leading-none font-medium">
					{text.upgrading}
				</span>
			)}
			{image ? (
				<img
					src={assetPath(image)}
					alt=""
					className={`size-10 object-contain [image-rendering:pixelated] ${owned ? "" : "opacity-40 grayscale"}`}
				/>
			) : (
				<span aria-hidden="true" className="bg-tint size-10 rounded-md" />
			)}
			<span className="font-semibold">{entry.name}</span>
			<span className="text-muted text-xs font-medium">{levelLabel(entry, value)}</span>
			<span aria-hidden="true" className="flex gap-1.5">
				{Array.from({ length: dots.total }).map((_, index) => (
					<span
						key={index}
						className={`size-2.5 rounded-full ${index < dots.filled ? (DOT_TONES[index] ?? "bg-primary") : "bg-track"}`}
					/>
				))}
			</span>
			<Select
				aria-label={text.level(entry.name)}
				value={String(value)}
				onChange={(event) => edit((d) => entry.set(d, Number(event.target.value)))}
			>
				{entry.options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</Select>
			<Button variant="link" onClick={onOpen} aria-haspopup="dialog" className="-mb-1">
				{text.details}
				<span className="sr-only"> {entry.name}</span>
			</Button>
		</Card>
	);
}

export function ToolsSection({ data, edit }: ToolsSectionProps) {
	const [open, setOpen] = useState<ToolEntry | null>(null);
	const upgrading = toolEntries.find((entry) => isUpgrading(data, entry));

	return (
		<Section title={text.title} badge={text.count(toolEntries.length)}>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				{toolEntries.map((entry) => (
					<ToolTile
						key={entry.id}
						entry={entry}
						data={data}
						edit={edit}
						onOpen={() => setOpen(entry)}
					/>
				))}
			</div>
			{upgrading && (
				<p className="text-muted text-sm">
					{text.beingUpgraded(upgrading.name)} {text.beingUpgradedNote}
				</p>
			)}
			<ToolPanelDialog entry={open} data={data} onClose={() => setOpen(null)} />
		</Section>
	);
}
