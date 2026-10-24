import type { ReactNode } from "react";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { Switch } from "@/comps/ui/Switch";

interface CheckCardProps {
	title: string;
	done: boolean;
	doneLabel: string;
	notDoneLabel: string;
	switchLabel: string;
	onChange: (done: boolean) => void;
	children: ReactNode;
}

/** A card with the switch in the top right corner and a tag that says the state in words. */
export function CheckCard({
	title,
	done,
	doneLabel,
	notDoneLabel,
	switchLabel,
	onChange,
	children,
}: CheckCardProps) {
	return (
		<Card className={`flex flex-col gap-2 p-3 ${done ? "border-kept" : ""}`}>
			<div className="flex items-start justify-between gap-3">
				<span className="font-semibold">{title}</span>
				<Switch checked={done} onChange={onChange} label={switchLabel} />
			</div>
			<div>
				<Badge tone={done ? "kept" : "locked"}>{done ? doneLabel : notDoneLabel}</Badge>
			</div>
			{children}
		</Card>
	);
}
