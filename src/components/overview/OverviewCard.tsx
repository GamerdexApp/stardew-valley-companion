import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";

interface OverviewCardProps {
	title: string;
	badge?: string;
	link?: { href: string; label: string };
	className?: string;
	children: ReactNode;
}

export function OverviewCard({ title, badge, link, className = "", children }: OverviewCardProps) {
	return (
		<Card className={`flex flex-col gap-4 p-4 ${className}`}>
			<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
				<h2 className="text-lg font-semibold">{title}</h2>
				<span className="flex items-center gap-3">
					{badge && (
						<span className="border-line text-muted rounded-full border-[1.5px] px-2 py-0.5 font-mono text-xs">
							{badge}
						</span>
					)}
					{link && (
						<Link
							href={link.href}
							className="text-link inline-flex min-h-11 items-center underline lg:min-h-9"
						>
							{link.label}
						</Link>
					)}
				</span>
			</div>
			{children}
		</Card>
	);
}

interface MeterRowProps {
	label: string;
	value: string;
	progress: number;
}

export function MeterRow({ label, value, progress }: MeterRowProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-baseline justify-between gap-3">
				<span className="font-medium">{label}</span>
				<span className="text-muted font-mono text-xs">{value}</span>
			</div>
			<ProgressBar value={progress} label={label} />
		</div>
	);
}
