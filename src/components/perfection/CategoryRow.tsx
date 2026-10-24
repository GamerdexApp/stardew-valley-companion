import { useId, useState } from "react";
import { LuCheck, LuChevronDown } from "react-icons/lu";
import { perfectionText } from "@/lib/messages/perfection";
import type { CategoryRow as Row } from "@/service/perfection";
import { Card } from "@/comps/ui/Card";
import { ProgressBar } from "@/comps/ui/ProgressBar";

const text = perfectionText.categories;

/** A category shows this many missing items until the player asks for the rest. */
const PREVIEW = 8;

export function CategoryRow({ row }: { row: Row }) {
	const { category } = row;
	const [open, setOpen] = useState(false);
	const [all, setAll] = useState(false);
	const regionId = useId();
	const shown = all ? category.missing : category.missing.slice(0, PREVIEW);
	const skills = category.id === "farmer-level";

	const summary = (
		<>
			<span className="flex min-w-0 flex-1 flex-col gap-1.5 text-start">
				<span className="flex items-center gap-2">
					{row.complete && (
						<LuCheck size={16} aria-hidden="true" className="text-kept shrink-0" />
					)}
					<span className="font-semibold">{category.name}</span>
				</span>
				<ProgressBar
					value={row.share}
					label={text.bar(category.name)}
					tone={row.complete ? "kept" : "primary"}
				/>
			</span>
			<span className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-xs">
				<span>{text.count(category.current, category.total)}</span>
				<span className="text-muted">{text.percent(row.share)}</span>
				<span className="text-muted">{text.points(row.points, category.weight)}</span>
			</span>
		</>
	);

	return (
		<Card className={`flex flex-col ${row.complete ? "border-kept" : ""}`}>
			{row.complete ? (
				<div className="flex items-center gap-3 p-3">{summary}</div>
			) : (
				<button
					type="button"
					aria-expanded={open}
					aria-controls={regionId}
					aria-label={text.open(category.name)}
					onClick={() => setOpen(!open)}
					className="flex min-h-11 items-center gap-3 p-3"
				>
					{summary}
					<LuChevronDown
						size={16}
						aria-hidden="true"
						className={`text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
					/>
				</button>
			)}
			<div
				id={regionId}
				hidden={!open || row.complete}
				className="flex flex-col gap-2 px-3 pb-3"
			>
				<span className="text-muted text-xs font-medium">
					{skills ? text.skillsMissing : text.missing(category.missing.length)}
				</span>
				<ul className="flex flex-wrap gap-1.5">
					{shown.map((item) => (
						<li
							key={item.id}
							className="border-line flex items-center gap-1.5 rounded-md border-[1.5px] px-2 py-1 text-sm"
						>
							{item.image && (
								<img
									src={item.image}
									alt=""
									width={20}
									height={20}
									className="size-5 shrink-0 object-contain [image-rendering:pixelated]"
								/>
							)}
							{item.name}
						</li>
					))}
				</ul>
				{category.missing.length > PREVIEW && (
					<button
						type="button"
						onClick={() => setAll(!all)}
						className="text-link flex min-h-11 items-center self-start text-sm font-semibold underline-offset-2 hover:underline lg:min-h-6"
					>
						{all
							? text.showFewer
							: `${text.more(category.missing.length - PREVIEW)}. ${text.showAll}`}
					</button>
				)}
			</div>
		</Card>
	);
}
