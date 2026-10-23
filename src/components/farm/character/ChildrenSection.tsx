import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { addChild, MAX_CHILDREN, removeChild, updateChild } from "@/service/character";
import { Button } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { NumberInput } from "@/comps/ui/NumberInput";
import { Select } from "@/comps/ui/Select";
import { Section } from "../Section";

const text = farmText.character.children;
const GENDERS: string[] = [
	farmText.character.profile.genders.male,
	farmText.character.profile.genders.female,
];

interface ChildrenSectionProps {
	data: GameData;
	edit: (change: (current: GameData) => GameData) => void;
	editWithUndo: (change: (current: GameData) => GameData, title: string) => void;
}

export function ChildrenSection({ data, edit, editWithUndo }: ChildrenSectionProps) {
	const { children } = data;
	const atLimit = children.length >= MAX_CHILDREN;

	return (
		<Section title={text.title} badge={text.count(children.length, MAX_CHILDREN)}>
			{children.length === 0 && <p className="text-muted">{text.empty}</p>}
			<ul className="flex flex-col gap-3">
				{children.map((child, index) => {
					const position = index + 1;
					const genders = GENDERS.includes(child.gender)
						? GENDERS
						: [child.gender, ...GENDERS];
					return (
						<li key={index}>
							<Card className="grid grid-cols-2 items-end gap-3 p-3 md:grid-cols-[1fr_8rem_9rem_auto]">
								<div className="col-span-2 md:col-span-1">
									<Field label={text.name(position)}>
										<Input
											value={child.name}
											onChange={(event) =>
												edit((d) =>
													updateChild(d, index, {
														name: event.target.value,
													})
												)
											}
										/>
									</Field>
								</div>
								<Field label={text.age(position)}>
									<NumberInput
										value={child.age}
										onChange={(age) =>
											edit((d) => updateChild(d, index, { age }))
										}
									/>
								</Field>
								<Field label={text.gender(position)}>
									<Select
										value={child.gender}
										onChange={(event) =>
											edit((d) =>
												updateChild(d, index, {
													gender: event.target.value,
												})
											)
										}
									>
										{genders.map((gender) => (
											<option key={gender} value={gender}>
												{gender}
											</option>
										))}
									</Select>
								</Field>
								<Button
									variant="danger"
									className="col-span-2 md:col-span-1"
									onClick={() =>
										editWithUndo(
											(d) => removeChild(d, index),
											child.name
												? `${child.name} removed`
												: `Child ${position} removed`
										)
									}
								>
									{text.remove(position)}
								</Button>
							</Card>
						</li>
					);
				})}
			</ul>
			<div className="flex flex-wrap items-center gap-3">
				<Button disabled={atLimit} onClick={() => edit(addChild)}>
					{text.add}
				</Button>
				<span className="text-muted text-xs">{text.limit}</span>
			</div>
		</Section>
	);
}
