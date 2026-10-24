import type { ReactNode } from "react";
import { LuSearch } from "react-icons/lu";
import { uiText } from "@/lib/messages/ui";
import { Button } from "@/comps/ui/Button";
import { Input } from "@/comps/ui/Input";

interface SearchBlockProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	summary: ReactNode;
}

const text = uiText.filters;

/** The toolbar of a list that has a name search and no other filter. */
export function SearchBlock({ label, value, onChange, summary }: SearchBlockProps) {
	return (
		<div role="group" aria-label={label} className="flex flex-col gap-3">
			<Input
				type="search"
				value={value}
				aria-label={label}
				placeholder={label}
				leadingIcon={<LuSearch size={16} aria-hidden="true" />}
				onChange={(event) => onChange(event.target.value)}
			/>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
				<span className="text-muted">{summary}</span>
				{value !== "" && (
					<Button variant="link" onClick={() => onChange("")}>
						{text.clearFilters}
					</Button>
				)}
			</div>
		</div>
	);
}
