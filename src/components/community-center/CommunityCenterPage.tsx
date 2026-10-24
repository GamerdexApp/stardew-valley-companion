"use client";

import type { Playthrough } from "@/types/app";
import { communityCenterText } from "@/lib/messages/communityCenter";
import { communityCenterSummary, jojaSummary, routeOf } from "@/service/communityCenter";
import { PageHeader } from "@/comps/shell/PageHeader";
import { PlaythroughGate } from "@/comps/shell/PlaythroughGate";
import { useFarmEdit } from "../farm/useFarmEdit";
import { CommunityCenterTab } from "./CommunityCenterTab";
import { DecisionCard } from "./DecisionCard";
import { JojaTab } from "./JojaTab";

const text = communityCenterText;

function CommunityCenterContent({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const { edit, editWithNote } = useFarmEdit(playthrough.id, data);
	const route = routeOf(data);
	const center = communityCenterSummary(data);
	const joja = jojaSummary(data);
	const progress =
		route === "joja"
			? `${joja.purchased} of ${joja.total} projects`
			: `${center.bundlesDone} of ${center.bundlesTotal} bundles · ${center.roomsDone} of ${center.roomsTotal} rooms`;

	return (
		<>
			<PageHeader
				title={text.titles[route]}
				subline={text.subline(text.routeNames[route], progress)}
			/>
			<DecisionCard route={route} />
			{route === "joja" ? (
				<JojaTab data={data} editWithNote={editWithNote} />
			) : (
				<CommunityCenterTab data={data} edit={edit} editWithNote={editWithNote} />
			)}
		</>
	);
}

export function CommunityCenterPage() {
	return (
		<PlaythroughGate title={text.title}>
			{(playthrough) => <CommunityCenterContent playthrough={playthrough} />}
		</PlaythroughGate>
	);
}
