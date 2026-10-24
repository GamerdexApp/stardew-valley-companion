import { itemsNeededText } from "@/lib/messages/itemsNeeded";
import { NEEDED_TAGS } from "@/service/itemsNeeded";
import type { TagFilter } from "@/service/itemsNeeded";

interface TagTilesProps {
	counts: Record<TagFilter, number>;
	active: TagFilter;
	/** The Gift tile needs a playthrough. */
	giftEnabled: boolean;
	onChange: (tag: TagFilter) => void;
}

/** The summary row is also the filter: one tile for each choice, with how many items it holds. */
export function TagTiles({ counts, active, giftEnabled, onChange }: TagTilesProps) {
	const tiles: TagFilter[] = ["all", ...NEEDED_TAGS];

	return (
		<div
			role="group"
			aria-label={itemsNeededText.filter.label}
			className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8"
		>
			{tiles.map((tag) => {
				const disabled = tag === "Gift" && !giftEnabled;
				return (
					<button
						key={tag}
						type="button"
						aria-pressed={active === tag}
						disabled={disabled}
						onClick={() => onChange(tag)}
						className={`flex min-h-11 flex-col items-start rounded-md border-[1.5px] px-3 py-2 text-start disabled:opacity-50 lg:min-h-9 ${
							active === tag ? "border-primary bg-tint" : "border-line bg-surface"
						}`}
					>
						<span className="text-muted font-mono text-xs uppercase">
							{itemsNeededText.tags[tag]}
						</span>
						<span className="font-mono text-xl">{counts[tag]}</span>
					</button>
				);
			})}
		</div>
	);
}
