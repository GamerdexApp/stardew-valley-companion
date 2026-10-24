import type { Playthrough } from "@/types/app";
import { questsText } from "@/lib/messages/quests";
import {
	isNoteFound,
	isScrapFound,
	journalScrapList,
	questsSummary,
	secretNoteList,
	setNoteFound,
	setScrapFound,
} from "@/service/quests";
import { useFarmEdit } from "../farm/useFarmEdit";
import { CheckCard } from "./CheckCard";
import { ChecklistSection } from "./ChecklistSection";

const text = questsText;
const labels = text.checklist;

export function SecretNotesTab({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const { edit } = useFarmEdit(playthrough.id, data);
	const summary = questsSummary(data);

	return (
		<>
			<ChecklistSection
				title={text.notes.title}
				badge={text.notes.badge(summary.notes, summary.notesTotal)}
				searchLabel={text.notes.search}
				items={secretNoteList}
				searchTexts={(note) => [note.description]}
				renderCard={(note) => (
					<CheckCard
						key={note.id}
						title={note.name}
						done={isNoteFound(data, note)}
						doneLabel={labels.found}
						notDoneLabel={labels.notFound}
						switchLabel={labels.foundSwitch(note.name)}
						onChange={(value) => edit((d) => setNoteFound(d, note, value))}
					>
						<p className="text-muted text-sm">{note.description}</p>
					</CheckCard>
				)}
			/>
			<ChecklistSection
				title={text.scraps.title}
				badge={text.scraps.badge(summary.scraps, summary.scrapsTotal)}
				note={text.scraps.note}
				searchLabel={text.scraps.search}
				items={journalScrapList}
				searchTexts={(scrap) => [scrap.description]}
				renderCard={(scrap) => (
					<CheckCard
						key={scrap.id}
						title={scrap.name}
						done={isScrapFound(data, scrap)}
						doneLabel={labels.found}
						notDoneLabel={labels.notFound}
						switchLabel={labels.foundSwitch(scrap.name)}
						onChange={(value) => edit((d) => setScrapFound(d, scrap, value))}
					>
						<p className="text-muted text-sm">{scrap.description}</p>
					</CheckCard>
				)}
			/>
		</>
	);
}
