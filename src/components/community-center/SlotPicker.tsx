import type { GameData } from "@/types/app";
import { communityCenterText } from "@/lib/messages/communityCenter";
import { bundlesIn } from "@/service/communityCenter";
import type { CatalogBundle, Room } from "@/service/communityCenter";
import { Field } from "@/comps/ui/Field";
import { Select } from "@/comps/ui/Select";

const text = communityCenterText.bundle;

interface SlotPickerProps {
	room: Room;
	data: GameData;
	slot: number;
	/** The bundle that sits in the slot, or none for an empty slot. */
	current: CatalogBundle | null;
	onPick: (bundle: CatalogBundle | null) => void;
}

/** Chooses the bundle of a remix slot from the bundles of its room that no other slot uses. */
export function SlotPicker({ room, data, slot, current, onPick }: SlotPickerProps) {
	const taken = new Set(bundlesIn(data, room).map((bundle) => bundle.id));
	const choices = room.pool.filter(
		(bundle) => bundle.id === current?.id || !taken.has(bundle.id)
	);

	return (
		<Field label={text.slot(slot)}>
			<Select
				value={current?.id ?? ""}
				aria-label={text.pickFor(room.label, slot)}
				onChange={(event) =>
					onPick(room.pool.find((bundle) => bundle.id === event.target.value) ?? null)
				}
			>
				<option value="">{text.chooseBundle}</option>
				{choices.map((bundle) => (
					<option key={bundle.id} value={bundle.id}>
						{bundle.name}
						{bundle.remixBundle ? " (Remix)" : ""}
					</option>
				))}
			</Select>
		</Field>
	);
}
