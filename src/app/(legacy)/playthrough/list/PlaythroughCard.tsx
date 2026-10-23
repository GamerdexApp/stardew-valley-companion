"use client";

import { Badge, Button, Card } from "flowbite-react";
import { useState } from "react";
import { HiPencil, HiTrash } from "react-icons/hi";
import type { PlaythroughCardProps } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { DeleteConfirmModal } from "@/comps/modals/DeleteConfirmModal";
import { EditPlaythroughModal } from "@/comps/modals/EditPlaythroughModal";

export default function PlaythroughCard({ playthrough }: PlaythroughCardProps) {
	const { activePlaythrough, setActivePlaythrough, deletePlaythrough } = usePlaythrough();
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	const isActive = activePlaythrough?.id === playthrough.id;

	const formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});

	return (
		<>
			<Card className={`relative ${isActive ? "ring-primary ring-2" : ""}`}>
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
							{playthrough.name}
						</h3>
						{isActive && (
							<Badge color="accent" className="mt-1 w-fit">
								Active
							</Badge>
						)}
					</div>
					<div className="flex shrink-0 gap-1">
						<Button
							size="xs"
							color="gray"
							onClick={() => setIsEditOpen(true)}
							title="Edit playthrough"
						>
							<HiPencil className="h-4 w-4" />
						</Button>
						<Button
							size="xs"
							color="red"
							onClick={() => setIsDeleteOpen(true)}
							title="Delete playthrough"
						>
							<HiTrash className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{playthrough.description && (
					<p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
						{playthrough.description}
					</p>
				)}

				<div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
					<p>Created: {formatDate(playthrough.createdAt)}</p>
					<p>Last modified: {formatDate(playthrough.lastModified)}</p>
				</div>

				{!isActive && (
					<Button
						color="accent"
						size="sm"
						className="mt-2 w-full"
						onClick={() => setActivePlaythrough(playthrough.id)}
					>
						Set Active
					</Button>
				)}
			</Card>

			<EditPlaythroughModal
				isOpen={isEditOpen}
				currentPlaythrough={playthrough}
				onClose={() => setIsEditOpen(false)}
			/>

			<DeleteConfirmModal
				isOpen={isDeleteOpen}
				onClose={() => setIsDeleteOpen(false)}
				onConfirm={() => deletePlaythrough(playthrough.id)}
				itemName={playthrough.name}
			/>
		</>
	);
}
