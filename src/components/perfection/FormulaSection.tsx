import { perfectionText } from "@/lib/messages/perfection";
import type { PerfectionView } from "@/service/perfection";
import { Section } from "@/comps/ui/Section";

const text = perfectionText.formula;

export function FormulaSection({ view }: { view: PerfectionView }) {
	return (
		<Section title={text.title}>
			<code className="bg-tint block overflow-x-auto rounded-md p-3 font-mono text-xs">
				{text.expression}
			</code>
			<p className="text-muted text-sm">{text.weights}</p>
			<p className="text-sm">{text.sum(view.base, view.score, view.waivers)}</p>
			<p className="text-muted text-sm">{text.cap}</p>
		</Section>
	);
}
