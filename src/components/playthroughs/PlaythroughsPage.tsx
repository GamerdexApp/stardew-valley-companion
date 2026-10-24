"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LuPlus, LuSearch, LuUpload, LuWrench } from "react-icons/lu";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { playthroughsText } from "@/lib/messages/playthroughs";
import {
	filterAndSort,
	isFiltered,
	nextActiveAfterDelete,
	perfectionPercent,
} from "@/service/playthroughList";
import type { PlatformFilter, PlaythroughSort } from "@/service/playthroughList";
import { PLATFORMS } from "@/data/constants/platforms";
import { NEW_PLAYTHROUGH_HREF } from "@/data/nav";
import { PageHeader } from "@/comps/shell/PageHeader";
import { Button, ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { EmptyState } from "@/comps/ui/EmptyState";
import { Input } from "@/comps/ui/Input";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Select } from "@/comps/ui/Select";
import { useToast } from "@/comps/ui/Toast";
import { DeletePlaythroughDialog } from "./DeletePlaythroughDialog";
import { EditPlaythroughDialog } from "./EditPlaythroughDialog";
import { PlaythroughCard } from "./PlaythroughCard";

const text = playthroughsText;

const sortOptions = (["lastModified", "name", "createdAt"] as const).map((id) => ({
	id,
	label: text.filters.sort[id],
}));

function StartPaths() {
	const paths = [
		{ href: `${NEW_PLAYTHROUGH_HREF}?path=upload`, Icon: LuUpload, ...text.empty.upload },
		{ href: `${NEW_PLAYTHROUGH_HREF}?path=build`, Icon: LuWrench, ...text.empty.build },
	];
	const location = text.empty.saveLocation;

	return (
		<div className="flex flex-col gap-4">
			<EmptyState
				title={text.empty.title}
				description={text.empty.description}
				actions={
					<ButtonLink href="/settings?tab=data" variant="link">
						{text.empty.importBackup}
					</ButtonLink>
				}
			/>
			<div className="grid gap-4 md:grid-cols-3">
				{paths.map(({ href, Icon, title, body }) => (
					<Link key={href} href={href} className="block">
						<Card className="hover:bg-tint flex h-full flex-col items-center gap-2 p-6 text-center">
							<Icon size={32} aria-hidden="true" className="text-primary" />
							<span className="text-lg font-semibold">{title}</span>
							<span className="text-muted">{body}</span>
						</Card>
					</Link>
				))}
				<Card className="flex flex-col gap-1.5 p-6">
					<span className="text-lg font-semibold">{location.title}</span>
					<span className="text-muted">{location.body}</span>
					<code className="font-mono text-xs break-all">{location.windows}</code>
					<code className="font-mono text-xs break-all">{location.unix}</code>
				</Card>
			</div>
		</div>
	);
}

export function PlaythroughsPage() {
	const {
		appData,
		playthroughs,
		activePlaythrough,
		setActivePlaythrough,
		deletePlaythrough,
		updateData,
	} = usePlaythrough();
	const showToast = useToast();
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<PlaythroughSort>("lastModified");
	const [platform, setPlatform] = useState<PlatformFilter>("all");
	const [editing, setEditing] = useState<Playthrough | null>(null);
	const [deleting, setDeleting] = useState<Playthrough | null>(null);

	const query = { search, sort, platform };
	const visible = useMemo(
		() => filterAndSort(playthroughs, { search, sort, platform }),
		[playthroughs, search, sort, platform]
	);
	const percents = useMemo(
		() => new Map(playthroughs.map((p) => [p.id, perfectionPercent(p)])),
		[playthroughs]
	);

	const clearFilters = () => {
		setSearch("");
		setPlatform("all");
	};

	const confirmDelete = (playthrough: Playthrough) => {
		const previous = deletePlaythrough(playthrough.id);
		if (!previous) return;
		showToast({
			variant: "success",
			title: text.delete.done(playthrough.name),
			message: text.delete.doneMessage,
			action: {
				label: text.delete.undo,
				onAction: () => updateData(() => previous),
			},
		});
	};

	const deletingIsActive = deleting !== null && deleting.id === activePlaythrough?.id;
	const nextActive = deleting ? nextActiveAfterDelete(playthroughs, deleting.id) : null;

	return (
		<>
			<PageHeader
				title={text.title}
				subline={text.subline}
				actions={
					<ButtonLink href={NEW_PLAYTHROUGH_HREF} variant="primary">
						<LuPlus size={16} aria-hidden="true" />
						{text.newPlaythrough}
					</ButtonLink>
				}
			/>
			{playthroughs.length === 0 ? (
				<StartPaths />
			) : (
				<>
					<Card className="flex flex-col gap-3 p-4">
						<div className="grid gap-3 lg:grid-cols-[1fr_auto_14rem] lg:items-center">
							<Input
								type="search"
								value={search}
								aria-label={text.filters.search}
								placeholder={text.filters.search}
								leadingIcon={<LuSearch size={16} aria-hidden="true" />}
								onChange={(event) => setSearch(event.target.value)}
							/>
							<SegmentedControl
								label={text.filters.sortLabel}
								options={sortOptions}
								value={sort}
								onChange={setSort}
							/>
							<Select
								aria-label={text.filters.platformLabel}
								value={platform}
								onChange={(event) =>
									setPlatform(event.target.value as PlatformFilter)
								}
							>
								<option value="all">{text.filters.allPlatforms}</option>
								{PLATFORMS.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</Select>
						</div>
						<div className="text-muted flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
							<span className="font-mono text-xs">
								{text.filters.showing(visible.length, playthroughs.length)}
							</span>
							{isFiltered(query) && (
								<Button variant="link" onClick={clearFilters}>
									{text.filters.clear}
								</Button>
							)}
						</div>
					</Card>
					{visible.length === 0 ? (
						<EmptyState
							title={text.noMatch.title(search)}
							description={text.noMatch.description}
							actions={<Button onClick={clearFilters}>{text.noMatch.clear}</Button>}
						/>
					) : (
						<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 2xl:grid-cols-3">
							{visible.map((playthrough) => (
								<PlaythroughCard
									key={playthrough.id}
									playthrough={playthrough}
									percent={percents.get(playthrough.id) ?? 0}
									isActive={playthrough.id === activePlaythrough?.id}
									onSetActive={() => setActivePlaythrough(playthrough.id)}
									onEdit={() => setEditing(playthrough)}
									onDelete={() => setDeleting(playthrough)}
								/>
							))}
						</div>
					)}
				</>
			)}
			<EditPlaythroughDialog playthrough={editing} onClose={() => setEditing(null)} />
			<DeletePlaythroughDialog
				playthrough={deleting}
				percent={deleting ? (percents.get(deleting.id) ?? 0) : 0}
				isActive={deletingIsActive}
				nextActiveName={nextActive?.name ?? null}
				appData={appData}
				onConfirm={confirmDelete}
				onClose={() => setDeleting(null)}
			/>
		</>
	);
}
