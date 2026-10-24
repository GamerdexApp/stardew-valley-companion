import { LuFlame } from "react-icons/lu";
import { grandpaText } from "@/lib/messages/grandpa";
import { CANDLE_STEPS } from "@/service/grandpa";
import type { Evaluation } from "@/service/grandpa";
import { Card } from "@/comps/ui/Card";

const text = grandpaText.score;

export function CandlesCard({ evaluation }: { evaluation: Evaluation }) {
	return (
		<Card className="flex flex-col gap-3 p-4">
			<h2 className="text-lg font-semibold">{text.title}</h2>
			<ul className="flex items-end gap-6">
				{CANDLE_STEPS.map((points, index) => {
					const lit = index < evaluation.candles;
					return (
						<li key={points} className="flex flex-col items-center gap-1">
							<LuFlame
								size={32}
								role="img"
								aria-label={text.candle(index + 1, lit)}
								className={lit ? "fill-warn text-warn" : "text-muted"}
							/>
							<span className="text-muted font-mono text-xs">
								{text.steps(points)}
							</span>
						</li>
					);
				})}
			</ul>
			<p className="text-muted text-sm">
				{evaluation.nextCandle
					? text.next(evaluation.nextCandle.needed, evaluation.candles + 1)
					: text.top}
			</p>
		</Card>
	);
}
