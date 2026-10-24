"use client";

import Image from "next/image";
import Link from "next/link";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { landingText } from "@/lib/messages/landing";
import { APP_NAME, HOME_HREF, NEW_PLAYTHROUGH_HREF } from "@/data/nav";
import { DISCORD_URL, GITHUB_URL } from "@/data/site";
import { ButtonLink } from "@/comps/ui/Button";

const text = landingText;

/** A visitor with a saved playthrough sees the way to the dashboard, a new visitor sees how to start. */
export function useReturningVisitor(): boolean {
	const { isLoaded, playthroughs } = usePlaythrough();
	return isLoaded && playthroughs.length > 0;
}

const linkClasses = "flex min-h-11 items-center px-2 hover:underline lg:min-h-9";

export function LandingHeader() {
	const returning = useReturningVisitor();

	return (
		<header className="border-line bg-surface sticky top-0 z-30 border-b-[1.5px]">
			<div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 lg:px-8">
				<Link href={HOME_HREF} className="flex min-h-11 items-center gap-2.5">
					<Image
						src="/stardew-valley-icon.png"
						alt=""
						width={32}
						height={32}
						className="block size-8 shrink-0 rounded-md"
					/>
					<span className="font-brand text-base leading-tight font-bold min-[360px]:text-lg">
						{APP_NAME}
					</span>
				</Link>
				<nav
					aria-label={text.header.label}
					className="ms-auto hidden items-center gap-1 md:flex"
				>
					<a href="#features" className={linkClasses}>
						{text.header.features}
					</a>
					<a href="#faq" className={linkClasses}>
						{text.header.faq}
					</a>
					<a
						href={GITHUB_URL}
						target="_blank"
						rel="noopener noreferrer"
						className={linkClasses}
					>
						{text.header.github}
					</a>
					<a
						href={DISCORD_URL}
						target="_blank"
						rel="noopener noreferrer"
						className={linkClasses}
					>
						{text.header.discord}
					</a>
				</nav>
				<span className="ms-auto md:ms-3">
					<ButtonLink href={returning ? "/overview" : NEW_PLAYTHROUGH_HREF}>
						{returning ? text.cta.dashboard : text.cta.start}
					</ButtonLink>
				</span>
			</div>
		</header>
	);
}
