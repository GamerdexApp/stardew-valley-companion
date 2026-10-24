"use client";

import { Suspense, useState } from "react";
import { LuGift } from "react-icons/lu";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useUrlParams } from "@/lib/hooks/useUrlParams";
import { itemsNeededText } from "@/lib/messages/itemsNeeded";
import {
	emptyNeededFilters,
	filterNeeded,
	isFilteringNeeded,
	isTagFilter,
	markGifted,
	neededItems,
	SCRATCH_DATA,
	tagCounts,
	trackedCount,
	untrackGift,
	villagerLabel,
} from "@/service/itemsNeeded";
import type { NeededFilters, TagFilter } from "@/service/itemsNeeded";
import { FilterBlock } from "@/comps/page/FilterBlock";
import type { FilterFieldConfig } from "@/comps/page/FilterBlock";
import { PageHeader } from "@/comps/shell/PageHeader";
import { Button } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Note } from "@/comps/ui/Note";
import { useFarmEdit } from "../farm/useFarmEdit";
import { NeededCard } from "./NeededCard";
import { TagTiles } from "./TagTiles";
import { TrackGiftDialog } from "./TrackGiftDialog";

const text = itemsNeededText;

function ItemsNeededContent() {
	const { activePlaythrough } = usePlaythrough();
	const data = activePlaythrough?.data ?? SCRATCH_DATA;
	const { edit, editWithNote } = useFarmEdit(activePlaythrough?.id ?? "", data);
	const url = useUrlParams();
	const requestedTag = url.get("tag");
	const tag: TagFilter =
		isTagFilter(requestedTag) && (requestedTag !== "Gift" || activePlaythrough)
			? requestedTag
			: "all";
	const [query, setQuery] = useState(url.get("q") ?? "");
	const [tracking, setTracking] = useState(false);

	const filters: NeededFilters = { tag, query };
	const items = neededItems(data);
	const counts = tagCounts(items);
	const shown = filterNeeded(items, filters);
	const clearFilters = () => {
		setQuery("");
		url.set({ tag: null, q: null });
	};

	const fields: FilterFieldConfig[] = [
		{
			id: "tag",
			label: text.filter.label,
			hint: activePlaythrough ? undefined : text.filter.giftNote,
			options: (
				[
					"all",
					"Donate",
					"Ship",
					"Cook",
					"Craft",
					"Build",
					"Bundle",
					...(activePlaythrough ? ["Gift"] : []),
				] as TagFilter[]
			).map((id) => ({
				id,
				label: `${id === "all" ? text.filter.all : text.tags[id]} (${counts[id]})`,
			})),
		},
	];

	const gifted = (villager: string, itemName: string) =>
		editWithNote(
			(d) => markGifted(d, villager, itemName),
			() => ({
				title: text.card.gifted(itemName, villagerLabel(villager)),
				undo: text.card.undo,
			})
		);
	const untrack = (villager: string, itemName: string) =>
		editWithNote(
			(d) => untrackGift(d, villager, itemName),
			() => ({
				title: text.card.untracked(itemName, villagerLabel(villager)),
				undo: text.card.undo,
			})
		);

	const farm = activePlaythrough?.data.character.farmName;

	return (
		<>
			<PageHeader
				title={text.title}
				subline={
					activePlaythrough
						? text.subline(farm ? `${farm} Farm` : activePlaythrough.name)
						: text.noPlaythrough
				}
			/>
			{!activePlaythrough && <Note>{text.scratchBanner}</Note>}
			{activePlaythrough && (
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-muted text-sm">{text.gifts.note}</p>
					<Button onClick={() => setTracking(true)} aria-haspopup="dialog">
						<LuGift size={16} aria-hidden="true" />
						{text.gifts.track}
						<span className="font-mono text-xs">{trackedCount(data)}</span>
					</Button>
				</div>
			)}
			<TagTiles
				counts={counts}
				active={tag}
				giftEnabled={Boolean(activePlaythrough)}
				onChange={(next) => url.set({ tag: next === "all" ? null : next })}
			/>
			<FilterBlock
				fields={fields}
				values={{ tag }}
				onChange={(_fieldId, value) => url.set({ tag: value === "all" ? null : value })}
				onClear={clearFilters}
				search={{
					label: text.search,
					value: query,
					onChange: (value) => {
						setQuery(value);
						url.set({ q: value });
					},
				}}
				summary={text.showing(
					shown.length,
					items.length,
					tag === "all" ? text.filter.all : text.tags[tag]
				)}
				flyoutTitle={text.filter.sheetTitle}
				showLabel={text.filter.apply(shown.length)}
			/>
			<p className="text-muted text-xs">{text.filter.keep}</p>
			{shown.length === 0 ? (
				<EmptyState
					title={
						isFilteringNeeded(filters) && query !== ""
							? text.empty.noMatch
							: tag === "all"
								? text.empty.all
								: text.empty.tag(text.tags[tag])
					}
					description={query === "" ? text.empty.done : ""}
					actions={
						isFilteringNeeded(filters) ? (
							<Button onClick={clearFilters}>{text.clear}</Button>
						) : undefined
					}
				/>
			) : (
				<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
					{shown.map((item) => (
						<NeededCard
							key={item.id}
							item={item}
							onGifted={gifted}
							onUntrack={untrack}
						/>
					))}
				</div>
			)}
			{tracking && activePlaythrough && (
				<TrackGiftDialog data={data} edit={edit} onClose={() => setTracking(false)} />
			)}
		</>
	);
}

export function ItemsNeededPage() {
	return (
		<Suspense fallback={null}>
			<ItemsNeededContent />
		</Suspense>
	);
}
