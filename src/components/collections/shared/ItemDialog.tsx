"use client";

import type { ReactNode } from "react";
import { assetPath } from "@/lib/utils/assetPath";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";

interface ItemDialogProps {
	open: boolean;
	onClose: () => void;
	closeLabel: string;
	title: string;
	image: string;
	/** The small line next to the image, such as the kind of item. */
	kind: string;
	children: ReactNode;
}

/** The frame the detail dialogs of a collection tab share: image, kind, then sections. */
export function ItemDialog({
	open,
	onClose,
	closeLabel,
	title,
	image,
	kind,
	children,
}: ItemDialogProps) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			title={title}
			footer={<Button onClick={onClose}>{closeLabel}</Button>}
		>
			<div className="flex items-center gap-3">
				<img
					src={assetPath(image)}
					alt=""
					className="size-14 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<span className="text-muted text-xs font-medium">{kind}</span>
			</div>
			{children}
		</Dialog>
	);
}

export function DialogSection({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="flex flex-col gap-2">
			<h3 className="font-semibold">{title}</h3>
			{children}
		</section>
	);
}

export function TextList({ items }: { items: string[] }) {
	return (
		<ul className="flex flex-col gap-1.5">
			{items.map((item) => (
				<li key={item} className="bg-bg rounded-md px-3 py-2">
					{item}
				</li>
			))}
		</ul>
	);
}
