import type { ReactNode } from "react";

interface CollectionBlockProps {
	id: string;
	title: string;
	badge: string;
	children: ReactNode;
}

/** One titled block of a collections tab, with a count badge. The id is the target of the jump links. */
export function CollectionBlock({ id, title, badge, children }: CollectionBlockProps) {
	const headingId = `${id}-heading`;
	return (
		<section id={id} aria-labelledby={headingId} className="flex scroll-mt-4 flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<h2 id={headingId} className="text-lg font-semibold">
					{title}
				</h2>
				<span className="border-line rounded-full border-[1.5px] px-2.5 py-0.5 font-mono text-xs whitespace-nowrap">
					{badge}
				</span>
			</div>
			{children}
		</section>
	);
}

export const BLOCK_GRID = "grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3";

/** The accessible name starts with the visible text, so voice control can say what it sees. */
export function DetailsButton({
	name,
	text,
	onClick,
}: {
	name: string;
	text: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={`${text}, ${name}`}
			className="text-link flex min-h-11 items-center self-start font-semibold underline-offset-2 hover:underline lg:min-h-6"
		>
			{text}
		</button>
	);
}
