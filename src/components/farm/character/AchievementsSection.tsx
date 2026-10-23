"use client";

import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { assetPath } from "@/lib/utils/assetPath";
import {
	allAchievements,
	emptyAchievementFilters,
	filterAchievements,
	isEarned,
	setAchievement,
} from "@/service/character";
import type { AchievementFilters } from "@/service/character";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Input } from "@/comps/ui/Input";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Switch } from "@/comps/ui/Switch";
import { Section } from "../Section";

const text = farmText.character.achievements;

/** The achievements shown before Show all, so the list does not run for 49 cards. */
const PREVIEW_COUNT = 12;

interface AchievementsSectionProps {
	data: GameData;
	edit: (change: (current: GameData) => GameData) => void;
}

export function AchievementsSection({ data, edit }: AchievementsSectionProps) {
	const [filters, setFilters] = useState<AchievementFilters>(emptyAchievementFilters);
	const [showAll, setShowAll] = useState(false);

	const matches = filterAchievements(data, filters);
	const shown = showAll ? matches : matches.slice(0, PREVIEW_COUNT);
	const earned = allAchievements.filter((achievement) => isEarned(data, achievement.id)).length;

	return (
		<Section title={text.title} badge={text.earned(earned, allAchievements.length)}>
			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full lg:w-72">
					<Input
						type="search"
						value={filters.query}
						aria-label={text.search}
						placeholder={text.search}
						leadingIcon={<LuSearch size={16} aria-hidden="true" />}
						onChange={(event) => setFilters({ ...filters, query: event.target.value })}
					/>
				</div>
				<SegmentedControl
					label={text.statusLabel}
					value={filters.status}
					onChange={(status) => setFilters({ ...filters, status })}
					options={[
						{ id: "all", label: text.status.all },
						{ id: "earned", label: text.status.earned },
						{ id: "locked", label: text.status.locked },
					]}
				/>
				<span className="text-muted">{text.showing(shown.length, matches.length)}</span>
				{matches.length > PREVIEW_COUNT && (
					<Button className="ms-auto" onClick={() => setShowAll(!showAll)}>
						{showAll ? text.showFewer : text.showAll(matches.length)}
					</Button>
				)}
			</div>
			{matches.length === 0 ? (
				<p className="text-muted">{text.empty}</p>
			) : (
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
					{shown.map((achievement) => {
						const has = isEarned(data, achievement.id);
						return (
							<Card
								key={achievement.id}
								highlighted={has}
								className={`flex items-start gap-3 p-3 ${has ? "bg-tint" : ""}`}
							>
								<img
									src={assetPath(achievement.icon ?? achievement.image)}
									alt=""
									className={`size-10 shrink-0 object-contain [image-rendering:pixelated] ${has ? "" : "opacity-50 grayscale"}`}
								/>
								<div className="flex min-w-0 flex-1 flex-col gap-0.5">
									<span className="font-semibold">{achievement.name}</span>
									<span className="text-muted text-xs">
										{achievement.description}
									</span>
								</div>
								<div className="flex shrink-0 flex-col items-end gap-1">
									<Switch
										checked={has}
										onChange={(value) =>
											edit((d) => setAchievement(d, achievement.id, value))
										}
										label={text.switchLabel(achievement.name)}
									/>
									<span
										className={`text-xs font-medium ${has ? "text-kept" : "text-muted"}`}
									>
										{has ? text.earnedLabel : text.lockedLabel}
									</span>
								</div>
							</Card>
						);
					})}
				</div>
			)}
		</Section>
	);
}
