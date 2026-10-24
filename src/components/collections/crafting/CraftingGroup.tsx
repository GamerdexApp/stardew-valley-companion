import type { ReactNode } from "react";
import { LuChevronDown } from "react-icons/lu";
import { collectionsText } from "@/lib/messages/collections";
import type { RecipeGroup } from "@/service/crafting";

const text = collectionsText.crafting.groups;

interface CraftingGroupProps {
	group: RecipeGroup;
	open: boolean;
	onToggle: () => void;
	children: ReactNode;
}

/** One category of recipes. The heading is the button that opens and closes it. */
export function CraftingGroup({ group, open, onToggle, children }: CraftingGroupProps) {
	const slug = group.category.replace(/\W+/g, "-").toLowerCase();
	return (
		<section aria-labelledby={`crafting-${slug}`} className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<h2 id={`crafting-${slug}`} className="min-w-0 flex-1 text-lg font-semibold">
					<button
						type="button"
						aria-expanded={open}
						aria-controls={`crafting-${slug}-recipes`}
						onClick={onToggle}
						className="hover:bg-tint -ms-2 flex min-h-11 w-full items-center gap-2 rounded-md px-2 text-start lg:min-h-9"
					>
						<LuChevronDown
							aria-hidden="true"
							size={18}
							className={`text-muted shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
						/>
						{group.category}
					</button>
				</h2>
				<span className="border-line rounded-full border-[1.5px] px-2.5 py-0.5 font-mono text-xs whitespace-nowrap">
					{text.badge(group.crafted, group.recipes.length)}
				</span>
			</div>
			<div
				id={`crafting-${slug}-recipes`}
				hidden={!open}
				className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3"
			>
				{children}
			</div>
		</section>
	);
}
