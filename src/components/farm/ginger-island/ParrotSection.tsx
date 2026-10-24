import { farmText } from "@/lib/messages/farm";
import { PARROT_RATE, WALNUT_TOTAL } from "@/service/gingerIsland";
import type { IslandSummary } from "@/service/gingerIsland";
import { Section } from "@/comps/ui/Section";
import { SummaryTile } from "@/comps/ui/SummaryTile";

const text = farmText.gingerIsland.parrot;

export function ParrotSection({ summary }: { summary: IslandSummary }) {
	return (
		<Section title={text.title} badge={text.badge(PARROT_RATE)}>
			<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
				<SummaryTile label={text.found} value={summary.found} total={WALNUT_TOTAL} />
				<SummaryTile
					label={text.remaining}
					value={summary.remaining}
					caption={text.remainingCaption}
				/>
				<SummaryTile
					label={text.rate}
					value={`${PARROT_RATE.toLocaleString()}g`}
					caption={text.rateCaption}
				/>
				<SummaryTile
					label={text.cost}
					value={`${summary.parrotCost.toLocaleString()}g`}
					caption={text.costCaption}
				/>
			</div>
		</Section>
	);
}
