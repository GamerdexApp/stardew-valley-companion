import { LuCheck } from "react-icons/lu";
import { newPlaythroughText } from "@/lib/messages/newPlaythrough";

const text = newPlaythroughText;

export function StepIndicator({
	steps,
	currentStep,
}: {
	steps: readonly string[];
	currentStep: number;
}) {
	return (
		<nav aria-label={text.stepsLabel}>
			<div className="flex flex-col gap-2 lg:hidden">
				<span className="font-mono text-xs">
					{text.stepOf(currentStep, steps.length)} · {steps[currentStep - 1]}
				</span>
				<div className="flex gap-1.5" aria-hidden="true">
					{steps.map((label, index) => (
						<span
							key={label}
							className={`h-1.5 flex-1 rounded-full ${
								index < currentStep ? "bg-primary" : "bg-track"
							}`}
						/>
					))}
				</div>
			</div>
			<ol className="hidden items-center gap-3 lg:flex">
				{steps.map((label, index) => {
					const number = index + 1;
					const done = number < currentStep;
					const current = number === currentStep;
					return (
						<li
							key={label}
							aria-current={current ? "step" : undefined}
							className="flex items-center gap-3"
						>
							<span
								className={`flex size-7 items-center justify-center rounded-full border-[1.5px] font-mono text-xs ${
									done
										? "border-primary bg-primary text-on-primary"
										: current
											? "border-primary text-primary"
											: "border-line text-muted"
								}`}
							>
								{done ? (
									<>
										<LuCheck size={14} aria-hidden="true" />
										<span className="sr-only">{text.stepDone}</span>
									</>
								) : (
									number
								)}
							</span>
							<span className={current ? "font-semibold" : "text-muted"}>
								{label}
							</span>
							{number < steps.length && (
								<span aria-hidden="true" className="bg-line h-px w-8" />
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
