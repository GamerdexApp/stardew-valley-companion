import type { GameData } from "@/types/app";
import { communityCenterText } from "@/lib/messages/communityCenter";
import {
	bundleSetOf,
	bundlesIn,
	clearSlot,
	roomProgress,
	setAllItems,
	setItemHandedIn,
	setRoomComplete,
	setSlotBundle,
} from "@/service/communityCenter";
import type { Room } from "@/service/communityCenter";
import { Section } from "@/comps/ui/Section";
import { Switch } from "@/comps/ui/Switch";
import type { EditNote } from "../farm/useFarmEdit";
import { BundleCard } from "./BundleCard";
import { SlotPicker } from "./SlotPicker";

const text = communityCenterText.room;

interface RoomSectionProps {
	room: Room;
	data: GameData;
	edit: (change: (current: GameData) => GameData) => void;
	editWithNote: EditNote;
}

export function RoomSection({ room, data, edit, editWithNote }: RoomSectionProps) {
	const progress = roomProgress(data, room);
	const remix = bundleSetOf(data) === "remix";
	const active = bundlesIn(data, room);
	const empty = Math.max(0, room.slots - active.length);

	return (
		<Section title={room.label} badge={text.badge(progress.done, progress.total)}>
			<div className="flex items-center justify-between gap-3">
				<span className="text-sm font-medium">{text.complete}</span>
				<Switch
					checked={progress.flag}
					label={text.switch(room.label)}
					onChange={(complete) =>
						editWithNote(
							(d) => setRoomComplete(d, room, complete),
							() => ({ title: text.marked(room.label, complete), undo: text.undo })
						)
					}
				/>
			</div>
			{progress.flag && <p className="text-muted text-xs">{text.locked}</p>}
			<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
				{active.map((bundle, index) => (
					<BundleCard
						key={bundle.id}
						bundle={bundle}
						data={data}
						onItem={(item, done) => edit((d) => setItemHandedIn(d, bundle, item, done))}
						onAll={(done) => edit((d) => setAllItems(d, bundle, done))}
						slot={
							remix && !progress.flag ? (
								<SlotPicker
									room={room}
									data={data}
									slot={index + 1}
									current={bundle}
									onPick={(next) =>
										edit((d) =>
											next
												? setSlotBundle(d, room, bundle, next)
												: clearSlot(d, room, bundle)
										)
									}
								/>
							) : undefined
						}
					/>
				))}
				{remix &&
					Array.from({ length: empty }, (_, index) => (
						<div
							key={`empty-${index}`}
							className="border-line rounded-md border-[1.5px] p-3"
						>
							<SlotPicker
								room={room}
								data={data}
								slot={active.length + index + 1}
								current={null}
								onPick={(next) =>
									next && edit((d) => setSlotBundle(d, room, null, next))
								}
							/>
						</div>
					))}
			</div>
		</Section>
	);
}
