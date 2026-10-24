import { landingText } from "@/lib/messages/landing";
import { assetPath } from "@/lib/utils/assetPath";
import { Card } from "@/comps/ui/Card";
import { Note } from "@/comps/ui/Note";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const text = landingText.features;

export function Features() {
	return (
		<section
			id="features"
			className="mx-auto flex max-w-6xl scroll-mt-20 flex-col gap-6 px-4 py-12 lg:px-8"
		>
			<div className="flex flex-col items-center gap-2 text-center">
				<SectionLabel className="text-muted">{text.eyebrow}</SectionLabel>
				<h2 className="font-brand text-3xl font-bold">{text.title}</h2>
				<p className="text-muted">{text.body}</p>
			</div>
			<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{text.items.map((feature) => (
					<li key={feature.title}>
						<Card className="flex h-full items-start gap-3 p-4">
							<img
								loading="lazy"
								decoding="async"
								src={assetPath(feature.image)}
								alt=""
								width={32}
								height={32}
								className="size-8 shrink-0 object-contain [image-rendering:pixelated]"
							/>
							<div className="flex flex-col gap-1">
								<h3 className="font-semibold">{feature.title}</h3>
								<p className="text-muted text-sm">{feature.body}</p>
							</div>
						</Card>
					</li>
				))}
			</ul>
			<Note title={text.importTitle}>
				{text.importBody} <span className="font-medium">{text.importTag}</span>
			</Note>
		</section>
	);
}
