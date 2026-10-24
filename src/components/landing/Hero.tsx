"use client";

import { landingText } from "@/lib/messages/landing";
import { NEW_PLAYTHROUGH_HREF, PLAYTHROUGHS_HREF } from "@/data/nav";
import { ButtonLink } from "@/comps/ui/Button";
import { useReturningVisitor } from "./LandingHeader";

const text = landingText;

export function Hero() {
	const returning = useReturningVisitor();

	return (
		<section className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 py-12 text-center">
			<h1 className="font-brand text-4xl leading-tight font-bold lg:text-5xl">
				{text.hero.title}
			</h1>
			<p className="text-muted max-w-2xl text-base lg:text-lg">{text.hero.body}</p>
			<div className="flex flex-wrap items-center justify-center gap-3">
				{returning ? (
					<>
						<ButtonLink href="/overview">{text.cta.dashboard}</ButtonLink>
						<ButtonLink href={PLAYTHROUGHS_HREF} variant="secondary">
							{text.cta.playthroughs}
						</ButtonLink>
					</>
				) : (
					<>
						<ButtonLink href={NEW_PLAYTHROUGH_HREF}>{text.cta.start}</ButtonLink>
						<ButtonLink href="#features" variant="secondary">
							{text.cta.learn}
						</ButtonLink>
					</>
				)}
			</div>
			<p className="text-muted text-sm">{text.hero.note}</p>
		</section>
	);
}
