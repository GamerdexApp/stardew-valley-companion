"use client";

import type { ReactNode } from "react";
import type { Playthrough } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { overviewText } from "@/lib/messages/overview";
import { NEW_PLAYTHROUGH_HREF, PLAYTHROUGHS_HREF } from "@/data/nav";
import { ButtonLink } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";
import { PageHeader } from "./PageHeader";

const text = overviewText.empty;

interface PlaythroughGateProps {
	title: string;
	subline?: string;
	children: (playthrough: Playthrough) => ReactNode;
}

/**
 * Shows the empty card when there is no active playthrough. The shell already holds the page until
 * storage is read, so the empty card only shows when there is truly none.
 */
export function PlaythroughGate({ title, subline, children }: PlaythroughGateProps) {
	const { activePlaythrough } = usePlaythrough();

	if (!activePlaythrough) {
		return (
			<>
				<PageHeader title={title} subline={subline} />
				<EmptyState
					title={text.title}
					description={text.description}
					actions={
						<>
							<ButtonLink href={NEW_PLAYTHROUGH_HREF} variant="primary">
								{text.create}
							</ButtonLink>
							<ButtonLink href={PLAYTHROUGHS_HREF}>{text.all}</ButtonLink>
						</>
					}
				/>
			</>
		);
	}
	return <>{children(activePlaythrough)}</>;
}
