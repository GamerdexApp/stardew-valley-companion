import { LuCheck, LuX } from "react-icons/lu";
import type { GameData } from "@/types/app";
import { overviewText } from "@/lib/messages/overview";
import { communityCenterFigures } from "@/service/overview";
import { OverviewCard } from "./OverviewCard";

const text = overviewText.communityCenter;

function StatusRow({
	label,
	done,
	doneText,
	openText,
}: {
	label: string;
	done: boolean;
	doneText: string;
	openText: string;
}) {
	return (
		<li className="border-line flex items-center gap-3 border-t-[1.5px] py-2 first:border-t-0">
			<span className="flex-1 font-medium">{label}</span>
			<span
				className={`flex items-center gap-1 text-xs font-medium ${done ? "text-kept" : "text-muted"}`}
			>
				{done ? (
					<LuCheck size={14} aria-hidden="true" />
				) : (
					<LuX size={14} aria-hidden="true" />
				)}
				{done ? doneText : openText}
			</span>
		</li>
	);
}

export function CommunityCenterCard({ data }: { data: GameData }) {
	const figures = communityCenterFigures(data);
	const isJoja = figures.path === "joja";

	return (
		<OverviewCard
			title={isJoja ? text.jojaTitle : text.title}
			badge={figures.badge}
			link={{
				href: "/community-center",
				label: isJoja
					? overviewText.open.jojaDevelopment
					: overviewText.open.communityCenter,
			}}
		>
			{isJoja && figures.completed && (
				<p className="border-kept text-kept flex items-center gap-2 rounded-md border-[1.5px] px-3 py-2 font-medium">
					<LuCheck size={16} aria-hidden="true" />
					{text.allProjects}
				</p>
			)}
			{figures.flags.length > 0 && (
				<ul className="flex flex-wrap gap-2">
					{figures.flags.map((flag) => (
						<li
							key={flag.label}
							className={`rounded-full border-[1.5px] px-2.5 py-0.5 text-xs font-medium ${
								flag.on ? "border-kept text-kept" : "border-line text-muted"
							}`}
						>
							{flag.label}: {flag.on ? text.flagYes : text.flagNo}
						</li>
					))}
				</ul>
			)}
			<ul className="flex flex-col">
				{figures.rows.map((row) => (
					<StatusRow
						key={row.label}
						label={row.label}
						done={row.done}
						doneText={isJoja ? text.purchased : text.complete}
						openText={isJoja ? text.notPurchased : text.notComplete}
					/>
				))}
			</ul>
		</OverviewCard>
	);
}
