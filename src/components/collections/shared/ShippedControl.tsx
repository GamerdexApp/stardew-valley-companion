import { collectionsText } from "@/lib/messages/collections";
import { Switch } from "@/comps/ui/Switch";
import { ValueStepper } from "@/comps/ui/ValueStepper";

const text = collectionsText.shipped;

interface ShippedControlProps {
	name: string;
	shipped: boolean;
	count: number;
	onShippedChange: (shipped: boolean) => void;
	onCountChange: (count: number) => void;
}

/** A Shipped switch with the state in words. A shipped item also has a count stepper. */
export function ShippedControl({
	name,
	shipped,
	count,
	onShippedChange,
	onCountChange,
}: ShippedControlProps) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
			<span className="flex items-center gap-3">
				<Switch
					checked={shipped}
					onChange={onShippedChange}
					label={text.switchLabel(name)}
				/>
				<span className={`text-xs font-medium ${shipped ? "text-kept" : "text-muted"}`}>
					{shipped ? text.shipped : text.notShipped}
				</span>
			</span>
			{shipped && (
				<ValueStepper
					label={text.countOf(name)}
					value={count}
					min={1}
					max={999999}
					onChange={onCountChange}
				/>
			)}
		</div>
	);
}

/**
 * The same control for the top right corner of a card: the switch with the state in words under
 * it, and for a shipped item the count stepper below. It sits beside the name, so the card needs
 * no row for it.
 */
export function ShippedCorner({
	name,
	shipped,
	count,
	onShippedChange,
	onCountChange,
}: ShippedControlProps) {
	return (
		<div className="flex shrink-0 flex-col items-end gap-1">
			<Switch checked={shipped} onChange={onShippedChange} label={text.switchLabel(name)} />
			<span className={`text-xs font-medium ${shipped ? "text-kept" : "text-muted"}`}>
				{shipped ? text.shipped : text.notShipped}
			</span>
			{shipped && (
				<ValueStepper
					label={text.countOf(name)}
					value={count}
					min={1}
					max={999999}
					onChange={onCountChange}
				/>
			)}
		</div>
	);
}
