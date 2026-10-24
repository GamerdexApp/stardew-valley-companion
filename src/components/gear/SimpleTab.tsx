"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { gearText } from "@/lib/messages/gear";
import { searchItems } from "@/lib/utils/searchItems";
import { SearchBlock } from "@/comps/page/SearchBlock";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Section } from "@/comps/ui/Section";

interface SimpleTabProps<T extends { id: string; name: string }> {
	title: string;
	/** The lower case name of the items, used in "Showing 3 of 18 footwear". */
	noun: string;
	items: T[];
	searchTexts?: (item: T) => (string | null | undefined)[];
	renderCard: (item: T) => ReactNode;
}

/** A list of gear with a name search. Every gear tab but Weapons has this shape. */
export function SimpleTab<T extends { id: string; name: string }>({
	title,
	noun,
	items,
	searchTexts,
	renderCard,
}: SimpleTabProps<T>) {
	const [query, setQuery] = useState("");
	const shown = searchItems(items, query, searchTexts);

	return (
		<Section title={title} badge={`${items.length} items`}>
			<SearchBlock
				label={gearText.search(noun)}
				value={query}
				onChange={setQuery}
				summary={gearText.showing(shown.length, items.length, noun)}
			/>
			{shown.length === 0 ? (
				<EmptyState title={gearText.empty} description="" />
			) : (
				<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
					{shown.map((item) => renderCard(item))}
				</div>
			)}
		</Section>
	);
}
