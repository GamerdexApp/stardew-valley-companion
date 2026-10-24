import { farmText } from "@/lib/messages/farm";
import { barShares } from "@/service/gingerIsland";
import type { IslandSummary } from "@/service/gingerIsland";
import { Field } from "@/comps/ui/Field";
import { NumberInput } from "@/comps/ui/NumberInput";
import { Section } from "../Section";

const text = farmText.gingerIsland.total;

interface WalnutTotalSectionProps {
	summary: IslandSummary;
	onChange: (count: number) => void;
}

export function WalnutTotalSection({ summary, onChange }: WalnutTotalSectionProps) {
	const shares = barShares(summary);

	return (
		<Section title={text.title}>
			<div className="max-w-xs">
				<Field label={text.field}>
					<NumberInput
						value={summary.found}
						min={0}
						max={130}
						onChange={onChange}
						aria-label={text.field}
					/>
				</Field>
			</div>
			<div
				role="img"
				aria-label={text.bar}
				className="bg-track flex h-3 w-full overflow-hidden rounded-full"
			>
				<span className="bg-kept h-full" style={{ width: `${shares.spent * 100}%` }} />
				<span className="bg-warn h-full" style={{ width: `${shares.available * 100}%` }} />
			</div>
			<p className="text-sm">
				{text.summary(summary.found, summary.spent, summary.available)}
			</p>
			<p className="text-muted text-xs">{text.legend}</p>
			<p className="text-muted text-xs">{text.note}</p>
		</Section>
	);
}
