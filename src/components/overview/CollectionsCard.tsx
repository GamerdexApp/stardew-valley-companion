import type { GameData } from "@/types/app";
import { overviewText } from "@/lib/messages/overview";
import { collectionRows } from "@/service/overview";
import { MeterRow, OverviewCard } from "./OverviewCard";

export function CollectionsCard({ data }: { data: GameData }) {
	return (
		<OverviewCard
			title={overviewText.collections.title}
			link={{ href: "/collections", label: overviewText.open.collections }}
		>
			<div className="flex flex-col gap-4">
				{collectionRows(data).map((row) => (
					<MeterRow
						key={row.label}
						label={row.label}
						value={`${row.current} / ${row.total} · ${row.percent}%`}
						progress={row.percent / 100}
					/>
				))}
			</div>
		</OverviewCard>
	);
}
