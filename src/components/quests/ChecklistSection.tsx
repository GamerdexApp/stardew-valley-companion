"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { LuSearch } from "react-icons/lu";
import { questsText } from "@/lib/messages/quests";
import { searchItems } from "@/lib/utils/searchItems";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { Section } from "@/comps/ui/Section";

const text = questsText.checklist;

interface ChecklistSectionProps<T extends { name: string }> {
	title: string;
	badge: string;
	note?: string;
	searchLabel: string;
	items: T[];
	/** Texts besides the name that the search looks in. */
	searchTexts?: (item: T) => (string | null | undefined)[];
	/** Controls shown above the search, such as a count field. */
	header?: ReactNode;
	renderCard: (item: T) => ReactNode;
}

/** A collapsible list with a search and a line that tells how many of the items are shown. */
export function ChecklistSection<T extends { name: string }>({
	title,
	badge,
	note,
	searchLabel,
	items,
	searchTexts,
	header,
	renderCard,
}: ChecklistSectionProps<T>) {
	const [query, setQuery] = useState("");
	const shown = searchItems(items, query, searchTexts);

	return (
		<Section title={title} badge={badge}>
			{note && <p className="text-muted text-sm">{note}</p>}
			{header}
			<Input
				type="search"
				value={query}
				aria-label={searchLabel}
				placeholder={searchLabel}
				leadingIcon={<LuSearch size={16} aria-hidden="true" />}
				onChange={(event) => setQuery(event.target.value)}
			/>
			<span className="text-muted">{text.showing(shown.length, items.length)}</span>
			{shown.length === 0 ? (
				<EmptyState
					title={text.empty}
					description=""
					actions={<Button onClick={() => setQuery("")}>{text.clear}</Button>}
				/>
			) : (
				<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
					{shown.map(renderCard)}
				</div>
			)}
		</Section>
	);
}
