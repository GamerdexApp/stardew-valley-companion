"use client";

import { useMemo, useState } from "react";
import { HiGift, HiInformationCircle, HiSearch, HiTrash, HiX } from "react-icons/hi";
import type { NeededItem, NeededTag, TrackedGift } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { buildGiftItems, buildNeededItems } from "@/lib/pages/items-needed";
import { ALL_VILLAGERS, TAG_COLORS, UNIVERSAL_GIFTS } from "@/data/constants/itemsNeeded";

type TagFilter = "All" | NeededTag;

const TAG_ORDER: TagFilter[] = ["All", "Donate", "Ship", "Cook", "Craft", "Build", "Gift"];

function itemMatchesFilter(item: NeededItem, filter: TagFilter): boolean {
	if (filter === "All") return true;
	return item.usages.some((u) => u.tag === filter);
}

export default function ItemsNeededPage() {
	const { activePlaythrough, addTrackedGift, removeTrackedGift } = usePlaythrough();
	const gameData = activePlaythrough?.data ?? null;

	const [activeFilter, setActiveFilter] = useState<TagFilter>("All");
	const [search, setSearch] = useState("");
	const [giftModalOpen, setGiftModalOpen] = useState(false);
	const [pickerVillager, setPickerVillager] = useState<string | null>(null);
	const [universalTier, setUniversalTier] = useState<"loves" | "likes" | "neutral" | null>(null);

	const baseItems = useMemo(() => buildNeededItems(gameData), [gameData]);
	const giftItems = useMemo(
		() => buildGiftItems(gameData?.trackedGifts ?? []),
		[gameData?.trackedGifts]
	);
	const allItems: NeededItem[] = useMemo(
		() => [...baseItems, ...giftItems],
		[baseItems, giftItems]
	);

	const counts = useMemo(() => {
		const result: Record<string, number> = { All: allItems.length };
		const tagSet: Record<string, Set<string>> = {};
		for (const item of allItems) {
			const tags = new Set(item.usages.map((u) => u.tag));
			for (const tag of tags) {
				if (!tagSet[tag]) tagSet[tag] = new Set();
				tagSet[tag].add(item.id);
			}
		}
		for (const [tag, set] of Object.entries(tagSet)) {
			result[tag] = set.size;
		}
		return result;
	}, [allItems]);

	const q = search.toLowerCase().trim();
	const displayed = useMemo(
		() =>
			allItems.filter((item) => {
				if (!itemMatchesFilter(item, activeFilter)) return false;
				if (q && !item.name.toLowerCase().includes(q)) return false;
				return true;
			}),
		[allItems, activeFilter, q]
	);

	const selectedVillager = pickerVillager
		? ALL_VILLAGERS.find((v) => v.name === pickerVillager)
		: null;

	const trackedGifts = gameData?.trackedGifts ?? [];
	const trackedKeys = new Set(trackedGifts.map((g) => `${g.villagerName}::${g.itemName}`));

	function handleAddGift(
		villagerName: string,
		itemName: string,
		preference?: "loves" | "likes" | "neutral"
	) {
		const gift: TrackedGift = { villagerName, itemName, given: false, preference };
		addTrackedGift(gift);
	}

	function openGiftModal() {
		setPickerVillager(null);
		setUniversalTier(null);
		setGiftModalOpen(true);
	}

	function closeGiftModal() {
		setGiftModalOpen(false);
		setPickerVillager(null);
		setUniversalTier(null);
	}

	const universalTierItems = universalTier
		? universalTier === "neutral"
			? UNIVERSAL_GIFTS.neutrals
			: UNIVERSAL_GIFTS[universalTier]
		: [];

	const summaryTags: NeededTag[] = ["Donate", "Ship", "Cook", "Craft", "Build", "Gift"];

	return (
		<div className="space-y-6 px-4 py-6">
			<div className="rounded-xl border border-[#d6d0bc] bg-white p-6 shadow-sm">
				<h1
					className="text-2xl font-extrabold text-gray-900"
					style={{ fontFamily: "var(--font-stardew-valley)" }}
				>
					Items Needed
				</h1>
				<p className="mt-1 text-sm text-gray-500">
					Everything still needed to complete your collection goals
				</p>

				<div className="mt-4 flex flex-wrap gap-3">
					<div className="flex min-w-20 flex-col rounded-lg border border-[#d6d0bc] bg-gray-50 px-4 py-2.5 text-center">
						<span className="text-2xl font-extrabold text-gray-900">
							{counts.All ?? 0}
						</span>
						<span className="text-xs text-gray-500">Total</span>
					</div>
					{summaryTags.map((tag) => (
						<div
							key={tag}
							className="flex min-w-20 flex-col rounded-lg border border-[#d6d0bc] bg-gray-50 px-4 py-2.5 text-center"
						>
							<span className="text-2xl font-extrabold text-gray-900">
								{counts[tag] ?? 0}
							</span>
							<span className="text-xs text-gray-500">{tag}</span>
						</div>
					))}
				</div>

				{!activePlaythrough && (
					<div className="mt-4 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
						<HiInformationCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
						<p className="text-sm text-blue-700">
							Create a playthrough to see your personal progress. Showing all items
							needed from scratch.
						</p>
					</div>
				)}
			</div>

			<div className="flex flex-wrap items-center gap-2">
				{TAG_ORDER.filter((t) => t !== "Gift" || activePlaythrough).map((tag) => (
					<button
						key={tag}
						type="button"
						onClick={() => setActiveFilter(tag)}
						className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
							activeFilter === tag
								? "border-gray-800 bg-gray-800 text-white"
								: "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
						}`}
					>
						{tag}
						<span
							className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
								activeFilter === tag
									? "bg-white/20 text-white"
									: "bg-gray-100 text-gray-500"
							}`}
						>
							{counts[tag] ?? 0}
						</span>
					</button>
				))}

				<div className="ml-auto flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm">
					<HiSearch className="h-4 w-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search items..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-40 cursor-text bg-transparent text-gray-700 outline-none placeholder:text-gray-400"
					/>
				</div>

				{activePlaythrough && (
					<button
						type="button"
						onClick={openGiftModal}
						className="bg-primary hover:bg-primary/90 flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-colors"
					>
						<HiGift className="h-4 w-4" />
						Track a Gift
					</button>
				)}
			</div>

			{displayed.length === 0 ? (
				<div className="rounded-xl border border-[#d6d0bc] bg-white p-12 text-center shadow-sm">
					<p className="text-lg font-bold text-gray-900">
						{activeFilter === "All"
							? "Nothing left to collect!"
							: `All ${activeFilter} items complete!`}
					</p>
					<p className="mt-1 text-sm text-gray-500">
						{q ? "No items match your search." : "Great work — this category is done."}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
					{displayed.map((item) => {
						const totalQty = item.usages.reduce((sum, u) => sum + (u.quantity ?? 0), 0);

						return (
							<div
								key={item.id}
								className="flex flex-col rounded-xl border border-[#d6d0bc] bg-white p-3 shadow-sm"
							>
								<div className="flex flex-col items-center">
									<div className="flex h-14 w-14 items-center justify-center">
										{item.image ? (
											<img
												src={item.image}
												alt={item.name}
												className="h-12 w-12 object-contain"
												onError={(e) => {
													(e.target as HTMLImageElement).style.display =
														"none";
												}}
											/>
										) : (
											<HiGift className="h-10 w-10 text-gray-300" />
										)}
									</div>
									<div className="mt-1.5 flex w-full items-center justify-center gap-1">
										<p className="truncate text-center text-[0.75rem] font-semibold text-gray-800">
											{item.name}
										</p>
										{totalQty > 0 && (
											<span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[0.6rem] font-bold text-gray-600">
												×{totalQty}
											</span>
										)}
									</div>
								</div>

								<div className="mt-2 flex flex-col gap-1">
									{item.usages.map((usage, i) => {
										const colors = TAG_COLORS[usage.tag];
										const isSimple =
											usage.tag === "Donate" || usage.tag === "Ship";
										return (
											<div
												key={i}
												className="flex flex-wrap items-center gap-1"
											>
												<span
													className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold ${colors.bg} ${colors.text}`}
												>
													{usage.tag}
												</span>
												{!isSimple && (
													<span className="min-w-0 truncate text-[0.6rem] text-gray-500">
														{usage.tag === "Gift"
															? `→ ${usage.goalName}${usage.preference ? ` (${usage.preference})` : ""}`
															: `→ ${usage.goalName}${usage.quantity ? ` ×${usage.quantity}` : ""}`}
													</span>
												)}
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{giftModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					onClick={(e) => {
						if (e.target === e.currentTarget) closeGiftModal();
					}}
				>
					<div className="w-full max-w-lg rounded-xl border border-[#d6d0bc] bg-white shadow-xl">
						<div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
							<p className="font-bold text-gray-900">
								{pickerVillager
									? `Pick an item for ${pickerVillager}`
									: universalTier
										? `Universal ${universalTier.charAt(0).toUpperCase() + universalTier.slice(1)}`
										: "Track a Gift"}
							</p>
							<button
								type="button"
								onClick={closeGiftModal}
								className="cursor-pointer rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
							>
								<HiX className="h-5 w-5" />
							</button>
						</div>

						<div className="max-h-[60vh] overflow-y-auto p-5">
							{pickerVillager ? (
								<div>
									<button
										type="button"
										onClick={() => setPickerVillager(null)}
										className="mb-3 cursor-pointer text-xs text-gray-500 hover:text-gray-700"
									>
										← Back
									</button>
									<div className="space-y-1">
										{selectedVillager && (
											<>
												{selectedVillager.loves.map((itemName) => {
													const tracked = trackedKeys.has(
														`${pickerVillager}::${itemName}`
													);
													return (
														<div
															key={`loves-${itemName}`}
															className="flex items-center justify-between rounded-lg border border-[#d6d0bc] px-3 py-2"
														>
															<div className="flex items-center gap-2">
																<span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-bold text-red-600">
																	Loves
																</span>
																<span className="text-sm font-medium text-gray-800">
																	{itemName}
																</span>
															</div>
															{tracked ? (
																<button
																	type="button"
																	onClick={() =>
																		removeTrackedGift(
																			itemName,
																			pickerVillager
																		)
																	}
																	className="cursor-pointer rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
																	title="Untrack"
																>
																	<HiTrash className="h-3.5 w-3.5" />
																</button>
															) : (
																<button
																	type="button"
																	onClick={() =>
																		handleAddGift(
																			pickerVillager,
																			itemName,
																			"loves"
																		)
																	}
																	className="bg-primary hover:bg-primary/90 cursor-pointer rounded px-2 py-0.5 text-xs font-semibold text-white"
																>
																	Add
																</button>
															)}
														</div>
													);
												})}
												{selectedVillager.likes.map((itemName) => {
													const tracked = trackedKeys.has(
														`${pickerVillager}::${itemName}`
													);
													return (
														<div
															key={`likes-${itemName}`}
															className="flex items-center justify-between rounded-lg border border-[#d6d0bc] px-3 py-2"
														>
															<div className="flex items-center gap-2">
																<span className="rounded-full bg-orange-100 px-2 py-0.5 text-[0.65rem] font-bold text-orange-600">
																	Likes
																</span>
																<span className="text-sm font-medium text-gray-800">
																	{itemName}
																</span>
															</div>
															{tracked ? (
																<button
																	type="button"
																	onClick={() =>
																		removeTrackedGift(
																			itemName,
																			pickerVillager
																		)
																	}
																	className="cursor-pointer rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
																	title="Untrack"
																>
																	<HiTrash className="h-3.5 w-3.5" />
																</button>
															) : (
																<button
																	type="button"
																	onClick={() =>
																		handleAddGift(
																			pickerVillager,
																			itemName,
																			"likes"
																		)
																	}
																	className="bg-primary hover:bg-primary/90 cursor-pointer rounded px-2 py-0.5 text-xs font-semibold text-white"
																>
																	Add
																</button>
															)}
														</div>
													);
												})}
											</>
										)}
									</div>
								</div>
							) : universalTier ? (
								<div>
									<button
										type="button"
										onClick={() => setUniversalTier(null)}
										className="mb-3 cursor-pointer text-xs text-gray-500 hover:text-gray-700"
									>
										← Back
									</button>
									<div className="space-y-1">
										{universalTierItems.map((itemName) => {
											const tracked = trackedKeys.has(
												`Universal::${itemName}`
											);
											const tierColor =
												universalTier === "loves"
													? "bg-red-100 text-red-600"
													: universalTier === "likes"
														? "bg-orange-100 text-orange-600"
														: "bg-gray-100 text-gray-600";
											return (
												<div
													key={itemName}
													className="flex items-center justify-between rounded-lg border border-[#d6d0bc] px-3 py-2"
												>
													<div className="flex items-center gap-2">
														<span
															className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold capitalize ${tierColor}`}
														>
															{universalTier}
														</span>
														<span className="text-sm font-medium text-gray-800">
															{itemName}
														</span>
													</div>
													{tracked ? (
														<button
															type="button"
															onClick={() =>
																removeTrackedGift(
																	itemName,
																	"Universal"
																)
															}
															className="cursor-pointer rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
															title="Untrack"
														>
															<HiTrash className="h-3.5 w-3.5" />
														</button>
													) : (
														<button
															type="button"
															onClick={() =>
																handleAddGift(
																	"Universal",
																	itemName,
																	universalTier
																)
															}
															className="bg-primary hover:bg-primary/90 cursor-pointer rounded px-2 py-0.5 text-xs font-semibold text-white"
														>
															Add
														</button>
													)}
												</div>
											);
										})}
									</div>
								</div>
							) : (
								<>
									{trackedGifts.length > 0 && (
										<div className="mb-5">
											<p className="mb-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
												Currently Tracking
											</p>
											<div className="space-y-1">
												{trackedGifts.map((g) => (
													<div
														key={`${g.villagerName}::${g.itemName}`}
														className="flex items-center justify-between rounded-lg border border-[#d6d0bc] px-3 py-2"
													>
														<div className="flex items-center gap-2">
															<span className="text-sm font-medium text-gray-800">
																{g.itemName}
															</span>
															<span className="text-xs text-gray-400">
																→ {g.villagerName}
															</span>
														</div>
														<button
															type="button"
															onClick={() =>
																removeTrackedGift(
																	g.itemName,
																	g.villagerName
																)
															}
															className="cursor-pointer rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
															title="Untrack"
														>
															<HiTrash className="h-3.5 w-3.5" />
														</button>
													</div>
												))}
											</div>
											<div className="my-4 border-t border-gray-100" />
										</div>
									)}

									<p className="mb-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
										Universal Gifts
									</p>
									<div className="mb-5 grid grid-cols-3 gap-2">
										{[
											{
												tier: "loves" as const,
												label: "Loves",
												count: UNIVERSAL_GIFTS.loves.length,
												color: "border-red-200 bg-red-50 hover:bg-red-100",
												text: "text-red-700",
											},
											{
												tier: "likes" as const,
												label: "Likes",
												count: UNIVERSAL_GIFTS.likes.length,
												color: "border-orange-200 bg-orange-50 hover:bg-orange-100",
												text: "text-orange-700",
											},
											{
												tier: "neutral" as const,
												label: "Neutral",
												count: UNIVERSAL_GIFTS.neutrals.length,
												color: "border-gray-200 bg-gray-50 hover:bg-gray-100",
												text: "text-gray-700",
											},
										].map(({ tier, label, count, color, text }) => (
											<button
												key={tier}
												type="button"
												onClick={() => setUniversalTier(tier)}
												className={`cursor-pointer rounded-lg border p-3 text-center transition-colors ${color}`}
											>
												<p className={`text-lg font-extrabold ${text}`}>
													{count}
												</p>
												<p className={`text-xs font-semibold ${text}`}>
													Universal {label}
												</p>
											</button>
										))}
									</div>

									<p className="mb-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
										By Villager
									</p>
									<div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
										{ALL_VILLAGERS.map((v) => (
											<button
												key={v.id}
												type="button"
												onClick={() => setPickerVillager(v.name)}
												className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-[#d6d0bc] p-2 hover:border-gray-400 hover:bg-gray-50"
											>
												<img
													src={`/${v.image}`}
													alt={v.name}
													className="h-12 w-12 rounded-full object-cover"
													onError={(e) => {
														(
															e.target as HTMLImageElement
														).style.display = "none";
													}}
												/>
												<span className="text-center text-[0.65rem] leading-tight font-semibold text-gray-700">
													{v.name}
												</span>
											</button>
										))}
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
