"use client";

import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { assetPath } from "@/lib/utils/assetPath";
import type { ToolEntry, ToolFacts, ToolRow } from "@/service/tools";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";

const text = farmText.character.tools;

const STATE_LABELS = { current: text.current, owned: text.owned, locked: text.locked } as const;

function Facts({ facts }: { facts: ToolFacts }) {
	const chips = [
		facts.bait ? text.baitSupport : null,
		facts.tackleSlots ? text.tackleSlots(facts.tackleSlots) : null,
		facts.fishingLevel ? text.fishingLevel(facts.fishingLevel) : null,
		facts.enchantable ? text.enchantable : null,
		facts.slots ? text.slots(facts.slots) : null,
	].filter((chip): chip is string => chip !== null);
	if (chips.length === 0) return null;
	return (
		<ul className="flex flex-wrap gap-1">
			{chips.map((chip) => (
				<li
					key={chip}
					className="border-line text-muted rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium"
				>
					{chip}
				</li>
			))}
		</ul>
	);
}

function Price({ row }: { row: ToolRow }) {
	if (row.cost !== null) {
		return (
			<span className="font-mono text-xs">
				{text.cost(row.cost)}
				{row.material && ` + ${text.material(row.material.quantity, row.material.name)}`}
			</span>
		);
	}
	return (
		<span className="text-muted text-xs">
			{row.obtain && row.obtain !== "starter" ? row.obtain : text.starter}
		</span>
	);
}

interface ToolPanelDialogProps {
	entry: ToolEntry | null;
	data: GameData;
	onClose: () => void;
}

/** The levels of a tool, a rod or the backpack, with what each costs and which one the player has. */
export function ToolPanelDialog({ entry, data, onClose }: ToolPanelDialogProps) {
	const rows = entry ? entry.rows(entry.value(data)) : [];

	return (
		<Dialog
			open={entry !== null}
			onClose={onClose}
			title={entry ? text.levels(entry.name) : ""}
			variant="wide"
			footer={<Button onClick={onClose}>{text.close}</Button>}
		>
			{entry && (
				<>
					<ul className="flex flex-col gap-2">
						{rows.map((row) => (
							<li
								key={row.name}
								className={`flex items-start gap-3 rounded-md border-[1.5px] p-3 ${
									row.state === "current"
										? "border-primary bg-tint"
										: "border-line bg-surface"
								} ${row.state === "locked" ? "opacity-70" : ""}`}
							>
								{row.image ? (
									<img
										src={assetPath(row.image)}
										alt=""
										className="size-10 shrink-0 object-contain [image-rendering:pixelated]"
									/>
								) : (
									<span
										aria-hidden="true"
										className="bg-tint size-10 shrink-0 rounded-md"
									/>
								)}
								<div className="flex min-w-0 flex-1 flex-col gap-1">
									<span className="flex flex-wrap items-center justify-between gap-2">
										<span className="font-semibold">{row.name}</span>
										<span
											className={`text-xs font-medium ${row.state === "current" ? "text-kept" : "text-muted"}`}
										>
											{STATE_LABELS[row.state]}
										</span>
									</span>
									<span className="text-muted text-sm">{row.description}</span>
									<Facts facts={row.facts} />
									<Price row={row} />
								</div>
							</li>
						))}
					</ul>
					{entry.canEnchant && <p className="text-muted text-xs">{text.canEnchant}</p>}
				</>
			)}
		</Dialog>
	);
}
