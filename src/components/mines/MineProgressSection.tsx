import type { GameData } from "@/types/app";
import { minesText } from "@/lib/messages/mines";
import { elevatorLevel, MINES_BOTTOM } from "@/service/mines";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { NumberStepper } from "@/comps/ui/NumberStepper";
import { Section } from "@/comps/ui/Section";
import { Switch } from "@/comps/ui/Switch";
import { ValueStepper } from "@/comps/ui/ValueStepper";

const text = minesText.progress;

interface MineProgressSectionProps {
	data: GameData;
	onMines: (floor: number) => void;
	onSkull: (floor: number) => void;
	onRustyKey: (has: boolean) => void;
	onSkullKey: (has: boolean) => void;
}

function KeyRow({
	name,
	hint,
	checked,
	onChange,
}: {
	name: string;
	hint: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<Card className="flex items-center justify-between gap-3 p-3">
			<span className="flex min-w-0 flex-col">
				<span className="font-semibold">{name}</span>
				<span className="text-muted text-xs">{hint}</span>
				<span className={`text-xs font-medium ${checked ? "text-kept" : "text-muted"}`}>
					{checked ? text.obtained : text.notObtained}
				</span>
			</span>
			<Switch checked={checked} onChange={onChange} label={text.switch(name)} />
		</Card>
	);
}

export function MineProgressSection({
	data,
	onMines,
	onSkull,
	onRustyKey,
	onSkullKey,
}: MineProgressSectionProps) {
	const { deepestMineLevel, deepestSkullCavernLevel, hasRustyKey, hasSkullKey } =
		data.mineProgress;
	const elevator = elevatorLevel(deepestMineLevel);

	return (
		<Section title={text.title}>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<Card className="flex flex-col gap-3 p-3">
					<Field label={text.mines} hint={text.minesHint}>
						<span className="flex items-center gap-3">
							<ValueStepper
								label={text.minesLabel}
								value={deepestMineLevel}
								min={0}
								max={MINES_BOTTOM}
								onChange={onMines}
							/>
							<span className="text-muted font-mono text-xs">
								{text.minesOf(deepestMineLevel)}
							</span>
						</span>
					</Field>
					<div className="flex items-center justify-between gap-3 text-sm">
						<span className="text-muted">{text.elevator}</span>
						<span className="font-mono font-medium">
							{elevator === 0 ? text.elevatorNone : text.elevatorFloor(elevator)}
						</span>
					</div>
				</Card>
				<Card className="flex flex-col gap-3 p-3">
					<Field label={text.skull} hint={text.skullHint}>
						<NumberStepper
							label={text.skullLabel}
							raiseLabel={`Raise ${text.skullLabel}`}
							lowerLabel={`Lower ${text.skullLabel}`}
							step={1}
							value={deepestSkullCavernLevel}
							onChange={onSkull}
						/>
					</Field>
					{deepestSkullCavernLevel > 0 && (
						<p className="text-muted text-sm">{text.beyond(deepestSkullCavernLevel)}</p>
					)}
				</Card>
				<KeyRow
					name={text.rusty}
					hint={text.rustyHint}
					checked={hasRustyKey}
					onChange={onRustyKey}
				/>
				<KeyRow
					name={text.skullKey}
					hint={text.skullKeyHint}
					checked={hasSkullKey}
					onChange={onSkullKey}
				/>
			</div>
		</Section>
	);
}
