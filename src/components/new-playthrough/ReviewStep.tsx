import { newPlaythroughText } from "@/lib/messages/newPlaythrough";
import type { ReviewSection } from "@/service/newPlaythrough";
import { Card } from "@/comps/ui/Card";

const text = newPlaythroughText.review;

function Section({ section }: { section: ReviewSection }) {
	return (
		<Card className="flex flex-col gap-1 p-4">
			<h3 className="font-semibold">{section.title}</h3>
			<dl>
				{section.rows.map((row) => (
					<div key={row.label} className="flex justify-between gap-4 py-1">
						<dt className="text-muted">{row.label}</dt>
						<dd className="text-end font-medium">{row.value}</dd>
					</div>
				))}
			</dl>
		</Card>
	);
}

interface ReviewStepProps {
	sections: ReviewSection[];
	savedAs: ReviewSection;
}

export function ReviewStep({ sections, savedAs }: ReviewStepProps) {
	return (
		<div className="flex flex-col gap-4">
			<h2 className="text-lg font-semibold">{text.heading}</h2>
			<div className="grid gap-3 lg:grid-cols-2">
				<Section section={savedAs} />
				{sections.map((section) => (
					<Section key={section.title} section={section} />
				))}
			</div>
		</div>
	);
}
