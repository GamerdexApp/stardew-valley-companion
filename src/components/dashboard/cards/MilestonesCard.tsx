"use client";

import type { DashboardProps } from "@/types";
import { countWalnutsFound } from "@/lib/utils/collectionCounts";
import { DASHBOARD_DATA } from "@/data/constants/dashboard";
import { NavySection } from "@/comps/ui/NavySection";

const {
	allStardrops,
	secretNotes,
	journalScraps,
	allLostBooks,
	townOrders,
	qiOrders,
	totalAchievements,
	totalBooks,
	totalSpecialItems,
} = DASHBOARD_DATA;

interface MilestoneTile {
	label: string;
	current: number;
	total?: number;
}

export function MilestonesCard({ gameData }: DashboardProps) {
	const stardropsFound = allStardrops.filter((s) => gameData.stardrops[s.id]).length;
	const walnuts = countWalnutsFound(gameData);
	const notesFound = secretNotes.filter((n) => gameData.secretNotes[n.id]).length;
	const scrapsFound = journalScraps.filter((n) => gameData.journalScraps[n.id]).length;
	const townDone = townOrders.filter((o) => gameData.specialOrdersCompleted[o.id]).length;
	const qiDone = qiOrders.filter((o) => gameData.specialOrdersCompleted[o.id]).length;

	const tiles: MilestoneTile[] = [
		{ label: "Stardrops", current: stardropsFound, total: allStardrops.length },
		{ label: "Golden Walnuts", ...walnuts },
		{ label: "Achievements", current: gameData.achievements.length, total: totalAchievements },
		{ label: "Secret Notes", current: notesFound, total: secretNotes.length },
		{ label: "Journal Scraps", current: scrapsFound, total: journalScraps.length },
		{ label: "Lost Books", current: gameData.lostBooksFound, total: allLostBooks.length },
		{ label: "Power Books", current: gameData.books.length, total: totalBooks },
		{ label: "Special Items", current: gameData.specialItems.length, total: totalSpecialItems },
		{ label: "Help Wanted", current: gameData.helpWantedCompleted },
		{ label: "Special Orders", current: townDone, total: townOrders.length },
		{ label: "Qi Orders", current: qiDone, total: qiOrders.length },
	];

	return (
		<NavySection title="Key Milestones">
			<div
				className="grid gap-2"
				style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}
			>
				{tiles.map(({ label, current, total }) => {
					const pct = total ? Math.min((current / total) * 100, 100) : null;
					const isComplete = total != null && current >= total;
					const valueColor = isComplete ? "text-green-300" : "text-highlight";

					return (
						<div
							key={label}
							className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-2.5"
						>
							<span className="text-[0.6rem] font-semibold tracking-wide text-white/80 uppercase">
								{label}
							</span>
							<span className={`text-[0.95rem] font-bold ${valueColor}`}>
								{current}
								{total != null && (
									<span className="ml-1 text-[0.7rem] font-semibold text-white/80">
										/ {total}
									</span>
								)}
							</span>
							{pct != null && (
								<div className="h-1 overflow-hidden rounded-full bg-white/10">
									<div
										className={`h-full rounded-full ${isComplete ? "bg-green-400" : "bg-accent"}`}
										style={{ width: `${pct}%` }}
									/>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</NavySection>
	);
}
