"use client";

import { useId } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { collectionsText } from "@/lib/messages/collections";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import { COLLECTION_GROUPS } from "@/data/collections";
import type { CollectionTabId } from "@/data/collections";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const text = collectionsText;

interface CollectionTabsProps {
	activeId: CollectionTabId;
	counts: Partial<Record<CollectionTabId, ProgressCount | null>>;
	onChange: (id: CollectionTabId) => void;
	children: ReactNode;
}

export function CollectionTabs({ activeId, counts, onChange, children }: CollectionTabsProps) {
	const baseId = useId();

	const move = (event: KeyboardEvent<HTMLDivElement>, tabs: CollectionTabId[]) => {
		const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
		if (step === 0) return;
		event.preventDefault();
		const index = tabs.indexOf(activeId);
		const next = tabs[(Math.max(index, 0) + step + tabs.length) % tabs.length];
		onChange(next);
		document.getElementById(`${baseId}-tab-${next}`)?.focus();
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3">
				{COLLECTION_GROUPS.map((group) => (
					<div key={group.id} className="flex flex-col gap-1.5">
						<SectionLabel className="text-muted">{text.groups[group.id]}</SectionLabel>
						<div
							role="tablist"
							aria-label={text.groups[group.id]}
							onKeyDown={(event) => move(event, group.tabs)}
							className="flex flex-wrap gap-2"
						>
							{group.tabs.map((id) => {
								const active = id === activeId;
								const count = counts[id];
								return (
									<button
										key={id}
										id={`${baseId}-tab-${id}`}
										type="button"
										role="tab"
										aria-selected={active}
										aria-controls={`${baseId}-panel`}
										tabIndex={active ? 0 : -1}
										onClick={() => onChange(id)}
										className={`flex min-h-11 items-center gap-2 rounded-full border-[1.5px] px-3.5 lg:min-h-9 ${
											active
												? "border-primary bg-primary text-on-primary font-medium"
												: "border-line bg-surface hover:bg-tint"
										}`}
									>
										{text.tabs[id]}
										{count && (
											<span
												className={`font-mono text-xs ${active ? "" : "text-muted"}`}
											>
												{count.current} / {count.total}
											</span>
										)}
									</button>
								);
							})}
						</div>
					</div>
				))}
			</div>
			<div
				id={`${baseId}-panel`}
				role="tabpanel"
				aria-labelledby={`${baseId}-tab-${activeId}`}
				className="flex flex-col gap-4"
			>
				{children}
			</div>
		</div>
	);
}
