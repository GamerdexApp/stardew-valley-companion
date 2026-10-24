import { collectionsText } from "@/lib/messages/collections";
import { difficultyLevel } from "@/service/fish";
import type { DifficultyLevel } from "@/service/fish";

const text = collectionsText.fish;

const FILL: Record<DifficultyLevel, string> = {
	easy: "bg-kept",
	medium: "bg-warn",
	hard: "bg-danger",
};

const TEXT: Record<DifficultyLevel, string> = {
	easy: "text-kept",
	medium: "text-warn",
	hard: "text-danger",
};

interface DifficultyBarProps {
	value: number;
	/** Names the bar for screen readers, for example "Anchovy difficulty". */
	ariaLabel: string;
	label?: string;
	showLevel?: boolean;
}

export function DifficultyBar({
	value,
	ariaLabel,
	label = text.card.difficulty,
	showLevel = false,
}: DifficultyBarProps) {
	const level = difficultyLevel(value);
	return (
		<div className="flex items-center gap-2">
			<span className="text-muted min-w-14 shrink-0 font-mono text-[11px] uppercase">
				{label}
			</span>
			<div
				role="progressbar"
				aria-label={ariaLabel}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={value}
				className="bg-track h-2 flex-1 overflow-hidden rounded-full"
			>
				<div
					className={`${FILL[level]} h-full rounded-full`}
					style={{ width: `${value}%` }}
				/>
			</div>
			<span className={`font-mono text-xs font-medium ${TEXT[level]}`}>
				{value}
				{showLevel && ` · ${text.dialog.levels[level]}`}
			</span>
		</div>
	);
}
