import { LuMinus, LuPlus } from "react-icons/lu";
import { MAX_FRIENDSHIP } from "@/service/animals";
import { IconButton } from "@/comps/ui/IconButton";
import { NumberInput } from "@/comps/ui/NumberInput";

/** Friendship points: a number field with a button on each side that moves it by 50. */
const STEP = 50;

interface FriendshipInputProps {
	value: number;
	label: string;
	raiseLabel: string;
	lowerLabel: string;
	onChange: (value: number) => void;
}

export function FriendshipInput({
	value,
	label,
	raiseLabel,
	lowerLabel,
	onChange,
}: FriendshipInputProps) {
	return (
		<span className="flex items-center gap-1">
			<IconButton
				compact
				label={lowerLabel}
				disabled={value <= 0}
				onClick={() => onChange(Math.max(0, value - STEP))}
				className="border-line bg-surface hover:bg-tint border-[1.5px]"
			>
				<LuMinus size={14} aria-hidden="true" />
			</IconButton>
			<NumberInput
				aria-label={label}
				className="w-20 text-center"
				value={value}
				max={MAX_FRIENDSHIP}
				onChange={onChange}
			/>
			<IconButton
				compact
				label={raiseLabel}
				disabled={value >= MAX_FRIENDSHIP}
				onClick={() => onChange(Math.min(MAX_FRIENDSHIP, value + STEP))}
				className="border-line bg-surface hover:bg-tint border-[1.5px]"
			>
				<LuPlus size={14} aria-hidden="true" />
			</IconButton>
		</span>
	);
}
