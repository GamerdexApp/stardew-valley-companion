import { perfectionText } from "@/lib/messages/perfection";
import { MAX_WAIVERS, WAIVER_COST } from "@/service/perfection";
import { Field } from "@/comps/ui/Field";
import { NumberStepper } from "@/comps/ui/NumberStepper";
import { Section } from "@/comps/ui/Section";

const text = perfectionText.waivers;

interface WaiversSectionProps {
	waivers: number;
	onChange: (count: number) => void;
}

export function WaiversSection({ waivers, onChange }: WaiversSectionProps) {
	return (
		<Section title={text.title} badge={text.badge(waivers)}>
			<p className="text-sm">{text.each}</p>
			<div className="max-w-xs">
				<Field label={text.label}>
					<NumberStepper
						step={1}
						max={MAX_WAIVERS}
						value={waivers}
						label={text.label}
						raiseLabel={text.raise}
						lowerLabel={text.lower}
						onChange={onChange}
					/>
				</Field>
			</div>
			<p className="text-sm font-medium">{text.boost(waivers)}</p>
			<p className="text-muted text-sm">{text.cost(WAIVER_COST.toLocaleString())}</p>
			<p className="text-muted text-sm">{text.how}</p>
		</Section>
	);
}
