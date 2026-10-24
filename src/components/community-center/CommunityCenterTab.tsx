import type { GameData } from "@/types/app";
import { communityCenterText } from "@/lib/messages/communityCenter";
import {
	abandonedBundle,
	bundleSetOf,
	chooseBundleSet,
	communityCenterSummary,
	rooms,
	setAllItems,
	setCeremony,
	setItemHandedIn,
	setJojaAbandoned,
} from "@/service/communityCenter";
import type { BundleSet } from "@/service/communityCenter";
import { Card } from "@/comps/ui/Card";
import { Note } from "@/comps/ui/Note";
import { Section } from "@/comps/ui/Section";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { Switch } from "@/comps/ui/Switch";
import type { EditNote } from "../farm/useFarmEdit";
import { BundleCard } from "./BundleCard";
import { RoomSection } from "./RoomSection";

const text = communityCenterText;

interface CommunityCenterTabProps {
	data: GameData;
	edit: (change: (current: GameData) => GameData) => void;
	editWithNote: EditNote;
}

function FlagRow({
	label,
	hint,
	checked,
	onChange,
}: {
	label: string;
	hint: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<Card className="flex items-center justify-between gap-3 p-3">
			<span className="flex min-w-0 flex-col">
				<span className="font-semibold">{label}</span>
				<span className="text-muted text-xs">{hint}</span>
			</span>
			<Switch checked={checked} onChange={onChange} label={label} />
		</Card>
	);
}

export function CommunityCenterTab({ data, edit, editWithNote }: CommunityCenterTabProps) {
	const summary = communityCenterSummary(data);
	const yesNo = (value: boolean) => (value ? text.tiles.yes : text.tiles.no);
	const set = bundleSetOf(data);

	return (
		<>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
				<SummaryTile label={text.tiles.unlocked} value={yesNo(summary.unlocked)} />
				<SummaryTile label={text.tiles.active} value={yesNo(summary.bundlesActive)} />
				<SummaryTile
					label={text.tiles.rooms}
					value={summary.roomsDone}
					total={summary.roomsTotal}
				/>
				<SummaryTile
					label={text.tiles.bundles}
					value={summary.bundlesDone}
					total={summary.bundlesTotal}
					emphasis={summary.bundlesDone === summary.bundlesTotal}
				/>
				<SummaryTile label={text.tiles.completed} value={yesNo(summary.completed)} />
				<SummaryTile
					label={text.tiles.ceremony}
					value={summary.ceremony ? text.tiles.attended : text.tiles.notYet}
				/>
				<SummaryTile label={text.tiles.abandoned} value={yesNo(summary.jojaAbandoned)} />
			</div>
			<Card className="flex flex-col gap-3 p-4">
				<h2 className="text-lg font-semibold">{text.set.title}</h2>
				<p className="text-muted text-sm">{text.set.note}</p>
				<div>
					<SegmentedControl
						label={text.set.title}
						value={set}
						onChange={(next: BundleSet) =>
							editWithNote(
								(d) => chooseBundleSet(d, next),
								() => ({ title: text.set.switched(next), undo: text.set.undo })
							)
						}
						options={[
							{ id: "standard", label: text.set.standard },
							{ id: "remix", label: text.set.remix },
						]}
					/>
				</div>
			</Card>
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				<FlagRow
					label={text.flags.ceremony}
					hint={text.flags.ceremonyHint}
					checked={summary.ceremony}
					onChange={(on) => edit((d) => setCeremony(d, on))}
				/>
				<FlagRow
					label={text.flags.abandoned}
					hint={text.flags.abandonedHint}
					checked={summary.jojaAbandoned}
					onChange={(on) => edit((d) => setJojaAbandoned(d, on))}
				/>
			</div>
			{summary.completed && <Note>{text.completedNote}</Note>}
			{rooms.map((room) => (
				<RoomSection
					key={room.id}
					room={room}
					data={data}
					edit={edit}
					editWithNote={editWithNote}
				/>
			))}
			{summary.jojaAbandoned ? (
				<Section title={text.abandoned.title}>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
						<BundleCard
							bundle={abandonedBundle}
							data={data}
							onItem={(item, done) =>
								edit((d) => setItemHandedIn(d, abandonedBundle, item, done))
							}
							onAll={(done) => edit((d) => setAllItems(d, abandonedBundle, done))}
						/>
					</div>
				</Section>
			) : (
				<Section title={text.abandoned.title}>
					<p className="text-muted text-sm">{text.abandoned.note}</p>
				</Section>
			)}
		</>
	);
}
