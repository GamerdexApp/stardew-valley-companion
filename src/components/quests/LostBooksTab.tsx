import type { Playthrough } from "@/types/app";
import { questsText } from "@/lib/messages/quests";
import { assetPath } from "@/lib/utils/assetPath";
import {
	allBooks,
	isBookFound,
	questsSummary,
	setBookFound,
	setBooksFound,
} from "@/service/quests";
import { Field } from "@/comps/ui/Field";
import { NumberStepper } from "@/comps/ui/NumberStepper";
import { useFarmEdit } from "../farm/useFarmEdit";
import { CheckCard } from "./CheckCard";
import { ChecklistSection } from "./ChecklistSection";

const text = questsText.books;
const labels = questsText.checklist;

export function LostBooksTab({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const { edit } = useFarmEdit(playthrough.id, data);
	const summary = questsSummary(data);

	return (
		<ChecklistSection
			title={text.title}
			badge={text.badge(summary.books, summary.booksTotal)}
			note={text.note}
			searchLabel={text.search}
			items={allBooks}
			searchTexts={(book) => [book.description]}
			header={
				<div className="max-w-xs">
					<Field label={text.found}>
						<NumberStepper
							step={1}
							max={summary.booksTotal}
							value={summary.books}
							label={text.foundLabel}
							raiseLabel={text.raise}
							lowerLabel={text.lower}
							onChange={(count) => edit((d) => setBooksFound(d, count))}
						/>
					</Field>
				</div>
			}
			renderCard={(book) => (
				<CheckCard
					key={book.id}
					title={book.name}
					done={isBookFound(data, book)}
					doneLabel={labels.found}
					notDoneLabel={labels.notFound}
					switchLabel={labels.foundSwitch(book.name)}
					onChange={(value) => edit((d) => setBookFound(d, book, value))}
				>
					<div className="flex items-start gap-2">
						<img
							src={assetPath(book.image)}
							alt=""
							width={24}
							height={24}
							className="size-6 shrink-0 object-contain [image-rendering:pixelated]"
						/>
						<p className="text-muted line-clamp-4 text-sm">{book.description}</p>
					</div>
				</CheckCard>
			)}
		/>
	);
}
