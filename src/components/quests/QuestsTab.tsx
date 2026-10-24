import type { SpecialOrderData } from "stardew-valley-data";
import type { Playthrough } from "@/types/app";
import { questsText } from "@/lib/messages/quests";
import {
	allQuests,
	isOrderDone,
	isQuestDone,
	qiOrders,
	questsSummary,
	setHelpWanted,
	setOrderDone,
	setQuestDone,
	townOrders,
} from "@/service/quests";
import { Field } from "@/comps/ui/Field";
import { NumberInput } from "@/comps/ui/NumberInput";
import { Section } from "@/comps/ui/Section";
import { useFarmEdit } from "../farm/useFarmEdit";
import { CheckCard } from "./CheckCard";
import { ChecklistSection } from "./ChecklistSection";

const text = questsText;
const labels = text.checklist;

export function QuestsTab({ playthrough }: { playthrough: Playthrough }) {
	const { data } = playthrough;
	const { edit } = useFarmEdit(playthrough.id, data);
	const summary = questsSummary(data);

	const orderSection = (
		title: string,
		search: string,
		orders: SpecialOrderData[],
		done: number
	) => (
		<ChecklistSection
			title={title}
			badge={text.orders.badge(done, orders.length)}
			searchLabel={search}
			items={orders}
			searchTexts={(order) => [
				order.text,
				order.requester,
				order.requirements,
				order.rewards,
			]}
			renderCard={(order) => (
				<CheckCard
					key={order.id}
					title={order.name}
					done={isOrderDone(data, order)}
					doneLabel={labels.done}
					notDoneLabel={labels.notDone}
					switchLabel={text.orders.switch(order.name)}
					onChange={(value) => edit((d) => setOrderDone(d, order, value))}
				>
					<p className="text-sm">{order.requirements}</p>
					<p className="text-muted text-xs">
						{text.orders.requester(order.requester)} ·{" "}
						{text.orders.days(order.timeframe)}
					</p>
					<p className="text-muted text-xs">{text.orders.reward(order.rewards)}</p>
				</CheckCard>
			)}
		/>
	);

	return (
		<>
			<Section title={text.helpWanted.title}>
				<p className="text-muted text-sm">{text.helpWanted.note}</p>
				<div className="max-w-xs">
					<Field label={text.helpWanted.title}>
						<NumberInput
							aria-label={text.helpWanted.title}
							value={summary.helpWanted}
							onChange={(count) => edit((d) => setHelpWanted(d, count))}
						/>
					</Field>
				</div>
			</Section>
			<ChecklistSection
				title={text.quests.title}
				badge={text.quests.badge(summary.quests, summary.questsTotal)}
				note={text.quests.note}
				searchLabel={text.quests.search}
				items={allQuests}
				searchTexts={(quest) => [
					quest.text,
					quest.requirements,
					quest.providedBy,
					quest.rewards,
				]}
				renderCard={(quest) => (
					<CheckCard
						key={`${quest.id}-${quest.name}`}
						title={quest.name}
						done={isQuestDone(data, quest)}
						doneLabel={labels.done}
						notDoneLabel={labels.notDone}
						switchLabel={text.quests.switch(quest.name)}
						onChange={(value) => edit((d) => setQuestDone(d, quest, value))}
					>
						<p className="text-sm">{quest.requirements}</p>
						<p className="text-muted text-xs">
							{text.quests.givenBy(quest.providedBy)}
						</p>
						<p className="text-muted text-xs">{text.quests.reward(quest.rewards)}</p>
					</CheckCard>
				)}
			/>
			{orderSection(text.town.title, text.town.search, townOrders, summary.town)}
			{orderSection(text.qi.title, text.qi.search, qiOrders, summary.qi)}
		</>
	);
}
