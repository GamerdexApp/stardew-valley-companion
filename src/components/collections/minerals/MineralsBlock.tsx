import type { ReactNode } from "react";

interface MineralsBlockProps {
	id: string;
	title: string;
	badge: string;
	children: ReactNode;
}

/** One of the six blocks of the Minerals tab. The id is the target of the jump links. */
export function MineralsBlock({ id, title, badge, children }: MineralsBlockProps) {
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

export function DetailsButton({
	label,
	text,
	onClick,
}: {
	label: string;
	text: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			className="text-link flex min-h-11 items-center self-start font-semibold underline-offset-2 hover:underline lg:min-h-6"
		>
			{text}
		</button>
	);
}
