"use client";

import { useId, useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import { landingText } from "@/lib/messages/landing";
import { Card } from "@/comps/ui/Card";
import { SectionLabel } from "@/comps/ui/SectionLabel";

const text = landingText.faq;

/** One answer is open at a time. The first starts open. */
export function Faq() {
	const [open, setOpen] = useState<number | null>(0);
	const baseId = useId();

	return (
		<section id="faq" className="mx-auto flex max-w-3xl scroll-mt-20 flex-col gap-6 px-4 py-12">
			<div className="flex flex-col items-center gap-2 text-center">
				<SectionLabel className="text-muted">{text.eyebrow}</SectionLabel>
				<h2 className="font-brand text-3xl font-bold">{text.title}</h2>
			</div>
			<ul className="flex flex-col gap-2">
				{text.items.map((item, index) => {
					const isOpen = open === index;
					return (
						<li key={item.question}>
							<Card className="flex flex-col">
								<h3>
									<button
										type="button"
										aria-expanded={isOpen}
										aria-controls={`${baseId}-${index}`}
										onClick={() => setOpen(isOpen ? null : index)}
										className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-start font-semibold"
									>
										{item.question}
										<LuChevronDown
											size={18}
											aria-hidden="true"
											className={`text-muted shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
										/>
									</button>
								</h3>
								<div
									id={`${baseId}-${index}`}
									hidden={!isOpen}
									className="text-muted px-4 pb-4 text-sm"
								>
									{item.answer}
								</div>
							</Card>
						</li>
					);
				})}
			</ul>
			<p className="text-muted text-center text-xs">{text.note}</p>
		</section>
	);
}
