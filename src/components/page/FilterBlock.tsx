"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { LuListFilter, LuSearch } from "react-icons/lu";
import { uiText } from "@/lib/messages/ui";
import { Button } from "@/comps/ui/Button";
import { Flyout } from "@/comps/ui/Flyout";
import { Input } from "@/comps/ui/Input";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { Select } from "@/comps/ui/Select";

export interface FilterFieldConfig {
	id: string;
	label: string;
	/** A chips field takes several options. Its value lists the chosen ids joined with a comma. */
	kind?: "choice" | "chips";
	/** The first option of a choice field is the "all" choice. */
	options: { id: string; label: string }[];
	/** A line under a choice field that explains what its options mean. */
	hint?: string;
}

interface FilterBlockProps {
	fields: FilterFieldConfig[];
	values: Record<string, string>;
	onChange: (fieldId: string, value: string) => void;
	onClear: () => void;
	search: { label: string; value: string; onChange: (value: string) => void };
	summary: ReactNode;
	flyoutTitle: string;
	/** The footer button, for example "Show 9 fish". The count follows the filters as they change. */
	showLabel: string;
	/** Buttons that sit to the right of the Filters button, such as an Add button. */
	actions?: ReactNode;
}

const text = uiText.filters;

/** A choice with more options than this is a select, because a radio list would run too long. */
const MAX_RADIO_OPTIONS = 8;

const emptyValue = (field: FilterFieldConfig) =>
	field.kind === "chips" ? "" : field.options[0].id;

const isFiltering = (field: FilterFieldConfig, values: Record<string, string>) =>
	(values[field.id] ?? emptyValue(field)) !== emptyValue(field);

const chosenIds = (value: string) => (value === "" ? [] : value.split(","));

function ChipsField({
	field,
	value,
	onChange,
}: {
	field: FilterFieldConfig;
	value: string;
	onChange: (value: string) => void;
}) {
	const chosen = chosenIds(value);
	const toggle = (id: string) =>
		onChange(
			(chosen.includes(id) ? chosen.filter((other) => other !== id) : [...chosen, id]).join(
				","
			)
		);

	return (
		<fieldset className="flex flex-col gap-2">
			<legend className="mb-2">
				<SectionLabel className="text-muted">{field.label}</SectionLabel>
			</legend>
			<div className="flex flex-wrap gap-2">
				{field.options.map((option) => {
					const on = chosen.includes(option.id);
					return (
						<label
							key={option.id}
							className={`flex min-h-11 cursor-pointer items-center rounded-full border-[1.5px] px-3.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--ring) lg:min-h-9 ${
								on
									? "border-primary bg-tint font-medium"
									: "border-line bg-surface text-muted"
							}`}
						>
							<input
								type="checkbox"
								checked={on}
								onChange={() => toggle(option.id)}
								className="sr-only"
							/>
							{option.label}
						</label>
					);
				})}
			</div>
		</fieldset>
	);
}

function ChoiceField({
	field,
	value,
	onChange,
}: {
	field: FilterFieldConfig;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="flex flex-col gap-2">
			<SectionLabel className="text-muted">{field.label}</SectionLabel>
			{field.options.length > MAX_RADIO_OPTIONS ? (
				<Select
					aria-label={field.label}
					value={value}
					onChange={(event) => onChange(event.target.value)}
				>
					{field.options.map((option) => (
						<option key={option.id} value={option.id}>
							{option.label}
						</option>
					))}
				</Select>
			) : (
				<RadioGroup
					label={field.label}
					options={field.options}
					value={value}
					onChange={onChange}
				/>
			)}
			{field.hint && <p className="text-muted text-xs">{field.hint}</p>}
		</div>
	);
}

export function FilterBlock({
	fields,
	values,
	onChange,
	onClear,
	search,
	summary,
	flyoutTitle,
	showLabel,
	actions,
}: FilterBlockProps) {
	const [open, setOpen] = useState(false);
	const activeCount = fields.filter((field) => isFiltering(field, values)).length;
	const hasFilters = activeCount > 0 || search.value !== "";

	return (
		<div
			role="group"
			aria-label={`${text.filters}: ${search.label}`}
			className="flex flex-col gap-3"
		>
			<div className="flex flex-wrap items-center gap-3">
				<div className="w-full lg:w-auto lg:flex-1">
					<Input
						type="search"
						value={search.value}
						aria-label={search.label}
						placeholder={search.label}
						leadingIcon={<LuSearch size={16} aria-hidden="true" />}
						onChange={(event) => search.onChange(event.target.value)}
					/>
				</div>
				<Button
					className="max-lg:flex-1"
					onClick={() => setOpen(true)}
					aria-haspopup="dialog"
				>
					<LuListFilter size={16} aria-hidden="true" />
					{text.filters}
					{activeCount > 0 && (
						<span className="bg-primary text-on-primary rounded-full px-1.5 font-mono text-xs">
							{activeCount}
							<span className="sr-only"> {text.activeCount(activeCount)}</span>
						</span>
					)}
				</Button>
				{actions}
			</div>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
				<span className="text-muted">{summary}</span>
				{hasFilters && (
					<Button variant="link" onClick={onClear}>
						{text.clearFilters}
					</Button>
				)}
			</div>
			<Flyout
				open={open}
				onClose={() => setOpen(false)}
				title={flyoutTitle}
				description={text.description}
				footer={
					<>
						<Button variant="link" onClick={onClear} className="me-auto">
							{text.reset}
						</Button>
						<Button variant="primary" onClick={() => setOpen(false)}>
							{showLabel}
						</Button>
					</>
				}
			>
				{fields.map((field) =>
					field.kind === "chips" ? (
						<ChipsField
							key={field.id}
							field={field}
							value={values[field.id] ?? ""}
							onChange={(value) => onChange(field.id, value)}
						/>
					) : (
						<ChoiceField
							key={field.id}
							field={field}
							value={values[field.id] ?? emptyValue(field)}
							onChange={(value) => onChange(field.id, value)}
						/>
					)
				)}
			</Flyout>
		</div>
	);
}
