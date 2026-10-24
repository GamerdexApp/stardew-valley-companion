import { LuStore } from "react-icons/lu";
import type { GameData } from "@/types/app";
import { communityCenterText } from "@/lib/messages/communityCenter";
import { formatNumber } from "@/lib/utils/formatting";
import {
	allProjects,
	isProjectPurchased,
	jojaSummary,
	setAllDeveloped,
	setProjectPurchased,
} from "@/service/communityCenter";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { Note } from "@/comps/ui/Note";
import { Section } from "@/comps/ui/Section";
import { SummaryTile } from "@/comps/ui/SummaryTile";
import { Switch } from "@/comps/ui/Switch";
import type { EditNote } from "../farm/useFarmEdit";

const text = communityCenterText;
const joja = text.joja;

interface JojaTabProps {
	data: GameData;
	editWithNote: EditNote;
}

export function JojaTab({ data, editWithNote }: JojaTabProps) {
	const summary = jojaSummary(data);

	return (
		<>
			<Card className="flex items-center gap-3 p-4">
				<LuStore size={28} aria-hidden="true" className="text-muted shrink-0" />
				<div className="flex min-w-0 flex-1 flex-col">
					<span className="font-semibold">{joja.membership}</span>
					<span className="text-muted text-sm">{joja.active}</span>
				</div>
				<Badge tone="kept">{joja.activeTag}</Badge>
			</Card>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<SummaryTile
					label={joja.tiles.projects}
					value={summary.purchased}
					total={summary.total}
					emphasis={summary.allDeveloped}
				/>
				<SummaryTile label={joja.tiles.invested} value={text.gold(summary.invested)} />
				<SummaryTile label={joja.tiles.remaining} value={text.gold(summary.remaining)} />
			</div>
			<Section title={joja.title} badge={joja.badge(summary.purchased, summary.total)}>
				<div className="flex items-center justify-between gap-3">
					<span className="flex flex-col">
						<span className="font-medium">{joja.allDeveloped}</span>
						<span className="text-muted text-xs">{joja.allDevelopedHint}</span>
					</span>
					<Switch
						checked={summary.allDeveloped}
						label={joja.allSwitch}
						onChange={(on) =>
							editWithNote(
								(d) => setAllDeveloped(d, on),
								() => ({ title: joja.allMarked(on), undo: joja.undo })
							)
						}
					/>
				</div>
				<div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
					{allProjects.map((project) => {
						const bought = isProjectPurchased(data, project);
						return (
							<Card
								key={project.id}
								className={`flex flex-col gap-2 p-3 ${bought ? "border-kept" : ""}`}
							>
								<div className="flex items-start justify-between gap-3">
									<span className="flex flex-col">
										<span className="font-semibold">{project.name}</span>
										<span className="text-muted font-mono text-xs">
											{text.gold(project.goldCost)}
										</span>
									</span>
									<Switch
										checked={bought}
										label={joja.switch(project.name)}
										onChange={(on) =>
											editWithNote(
												(d) => setProjectPurchased(d, project, on),
												() => ({
													title: joja.marked(project.name, on),
													undo: joja.undo,
												})
											)
										}
									/>
								</div>
								<div>
									<Badge tone={bought ? "kept" : "locked"}>
										{bought ? joja.purchased : joja.notPurchased}
									</Badge>
								</div>
								<p className="text-muted text-sm">{project.description}</p>
								<p className="text-xs font-medium">
									{joja.unlocks(project.unlock)}
								</p>
							</Card>
						);
					})}
				</div>
				<Note>{joja.note}</Note>
			</Section>
		</>
	);
}
