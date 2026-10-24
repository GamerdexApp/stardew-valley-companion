"use client";

import { useState } from "react";
import type { ButtonHTMLAttributes } from "react";
import { LuChevronDown, LuPlus } from "react-icons/lu";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { shellText } from "@/lib/messages/shell";
import { getFarmIcon } from "@/lib/utils/farmIcon";
import { formatGameDate } from "@/service/playthroughList";
import { NEW_PLAYTHROUGH_HREF, PLAYTHROUGHS_HREF } from "@/data/nav";
import { Dialog } from "@/comps/ui/Dialog";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/comps/ui/Menu";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const text = shellText.switcher;

interface ChoicesProps {
	inMenu: boolean;
	close: () => void;
	onNavigate?: () => void;
}

function PlaythroughChoices({ inMenu, close, onNavigate }: ChoicesProps) {
	const { playthroughs, activePlaythrough, setActivePlaythrough } = usePlaythrough();
	const role = inMenu ? "menuitem" : "button";
	const followLink = () => {
		close();
		onNavigate?.();
	};

	return (
		<>
			{playthroughs.length > 0 && (
				<>
					{inMenu && <MenuLabel>{text.playthroughs}</MenuLabel>}
					{playthroughs.map((playthrough) => {
						const isActive = playthrough.id === activePlaythrough?.id;
						return (
							<MenuItem
								key={playthrough.id}
								role={role}
								active={isActive}
								className="justify-between gap-2"
								onSelect={() => {
									setActivePlaythrough(playthrough.id);
									close();
								}}
							>
								<span className="flex min-w-0 flex-col">
									<span className="truncate font-medium">{playthrough.name}</span>
									<span className="text-muted truncate text-xs">
										{formatGameDate(playthrough)}
									</span>
								</span>
								{isActive && (
									<span className="text-primary font-mono text-xs font-medium">
										{text.active}
									</span>
								)}
							</MenuItem>
						);
					})}
					<MenuSeparator />
				</>
			)}
			<MenuItem
				role={role}
				href={PLAYTHROUGHS_HREF}
				onSelect={followLink}
				className="gap-2 font-medium"
			>
				{text.all}
			</MenuItem>
			<MenuItem
				role={role}
				href={NEW_PLAYTHROUGH_HREF}
				onSelect={followLink}
				className="text-primary gap-2.5 font-semibold"
			>
				<LuPlus size={16} aria-hidden="true" />
				{text.create}
			</MenuItem>
		</>
	);
}

export function PlaythroughSwitcher({ onNavigate }: { onNavigate?: () => void }) {
	const { activePlaythrough, isLoaded } = usePlaythrough();
	const isDesktop = useIsDesktop();
	const [sheetOpen, setSheetOpen] = useState(false);

	const triggerName = !isLoaded ? text.loading : (activePlaythrough?.name ?? text.none);
	const triggerDetail = activePlaythrough ? formatGameDate(activePlaythrough) : "";
	const farmIcon = activePlaythrough
		? getFarmIcon(activePlaythrough.data.character.farmType)
		: null;

	const renderTrigger = (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
		<button
			type="button"
			disabled={!isLoaded}
			{...props}
			className="border-sb-line text-sb-text flex h-12 w-full items-center justify-between gap-2 rounded-md border-[1.5px] px-3 text-start"
		>
			<span className="flex min-w-0 items-center gap-2.5">
				<span
					aria-hidden="true"
					className="bg-sb-line flex size-7 shrink-0 items-center justify-center overflow-hidden rounded"
				>
					{farmIcon && (
						<img
							src={farmIcon}
							alt=""
							width={28}
							height={28}
							className="size-7 object-contain [image-rendering:pixelated]"
						/>
					)}
				</span>
				<span className="flex min-w-0 flex-col">
					<span className="truncate font-medium">{triggerName}</span>
					{triggerDetail && (
						<span className="text-sb-muted truncate text-xs">{triggerDetail}</span>
					)}
				</span>
			</span>
			<LuChevronDown size={14} aria-hidden="true" className="text-sb-muted shrink-0" />
		</button>
	);

	return (
		<div className="flex flex-col gap-1.5">
			<SectionLabel className="text-sb-muted">{text.sectionLabel}</SectionLabel>
			{isDesktop ? (
				<Menu label={text.switch} trigger={({ props }) => renderTrigger(props)}>
					{(close) => <PlaythroughChoices inMenu close={close} onNavigate={onNavigate} />}
				</Menu>
			) : (
				<>
					{renderTrigger({
						"aria-haspopup": "dialog",
						onClick: () => setSheetOpen(true),
					})}
					<Dialog
						open={sheetOpen}
						onClose={() => setSheetOpen(false)}
						title={text.switch}
					>
						<div className="-mx-2 flex flex-col gap-0.5">
							<PlaythroughChoices
								inMenu={false}
								close={() => setSheetOpen(false)}
								onNavigate={onNavigate}
							/>
						</div>
					</Dialog>
				</>
			)}
		</div>
	);
}
