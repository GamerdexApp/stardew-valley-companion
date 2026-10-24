import Link from "next/link";
import { LuCheck, LuLock } from "react-icons/lu";
import { grandpaText } from "@/lib/messages/grandpa";
import { formatNumber } from "@/lib/utils/formatting";
import type { CategoryView, CriterionRow } from "@/service/grandpa";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { Section } from "@/comps/ui/Section";

const text = grandpaText;

function rowLabel(row: CriterionRow): string {
	return row.id.startsWith("earnings-")
		? text.earningsLabel(formatNumber(Number(row.label)))
		: (text.labels[row.label] ?? row.label);
}

function Row({ row }: { row: CriterionRow }) {
	const label = rowLabel(row);
	const ceremony = row.id === "Community Center Ceremony Attended" && !row.earned;

	return (
		<li
			className={`flex flex-col gap-1.5 rounded-md border-[1.5px] p-3 ${row.earned ? "border-kept" : "border-line"}`}
		>
			<div className="flex items-center gap-2">
				{row.earned ? (
					<LuCheck size={16} aria-hidden="true" className="text-kept shrink-0" />
				) : (
					<LuLock size={16} aria-hidden="true" className="text-muted shrink-0" />
				)}
				<span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
				<span className="font-mono text-xs">
					{text.row.points(row.points, row.maxPoints)}
				</span>
				<span className="sr-only">{row.earned ? text.row.earned : text.row.notEarned}</span>
			</div>
			{ceremony && <span className="text-muted text-xs">{text.row.notYet}</span>}
			{row.progress && (
				<>
					<ProgressBar
						value={
							row.progress.total > 0 ? row.progress.current / row.progress.total : 0
						}
						label={text.row.bar(label)}
					/>
					<span className="text-muted font-mono text-xs">
						{text.row.progress(
							formatNumber(row.progress.current),
							formatNumber(row.progress.total),
							row.progress.unit
						)}
					</span>
				</>
			)}
		</li>
	);
}

interface CategorySectionProps {
	category: CategoryView;
	note: string;
	/** A link under the note, such as the one to the Character tab. */
	link?: { href: string; label: string };
}

export function CategorySection({ category, note, link }: CategorySectionProps) {
	return (
		<Section
			title={text.categories[category.id]}
			badge={text.badge(category.earned, category.max)}
		>
			{note && <p className="text-muted text-sm">{note}</p>}
			{link && (
				<Link
					href={link.href}
					className="text-link flex min-h-11 items-center self-start font-semibold underline-offset-2 hover:underline lg:min-h-6"
				>
					{link.label}
				</Link>
			)}
			<ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
				{category.rows.map((row) => (
					<Row key={row.id} row={row} />
				))}
			</ul>
		</Section>
	);
}
