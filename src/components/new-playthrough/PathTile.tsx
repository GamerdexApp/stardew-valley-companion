import type { ReactNode } from "react";

interface PathTileProps {
	icon: ReactNode;
	title: string;
	body: string;
	selected?: boolean;
	onSelect: () => void;
}

export function PathTile({ icon, title, body, selected, onSelect }: PathTileProps) {
	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={selected}
			className={`flex min-h-11 flex-col items-center gap-2 rounded-md border-[1.5px] p-6 text-center transition-colors ${
				selected ? "border-primary bg-tint" : "border-line bg-surface hover:bg-tint"
			}`}
		>
			<span aria-hidden="true" className="text-primary">
				{icon}
			</span>
			<span className="text-lg font-semibold">{title}</span>
			<span className="text-muted">{body}</span>
		</button>
	);
}
