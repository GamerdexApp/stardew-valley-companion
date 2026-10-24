import { landingText } from "@/lib/messages/landing";

const text = landingText.steps;

export function Steps() {
	return (
		<section className="bg-tint">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 lg:px-8">
				<div className="flex flex-col items-center gap-2 text-center">
					<h2 className="font-brand text-3xl font-bold">{text.title}</h2>
					<p className="text-muted">{text.body}</p>
				</div>
				<ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{text.items.map((step, index) => (
						<li
							key={step.title}
							className="flex flex-col items-center gap-2 text-center"
						>
							<span
								aria-hidden="true"
								className="bg-primary text-on-primary flex size-10 items-center justify-center rounded-full font-mono font-medium"
							>
								{index + 1}
							</span>
							<h3 className="font-semibold">{step.title}</h3>
							<p className="text-muted text-sm">{step.body}</p>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}
