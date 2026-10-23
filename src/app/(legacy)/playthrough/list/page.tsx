"use client";

import { Badge, Button, Card, TextInput } from "flowbite-react";
import { useMemo, useState } from "react";
import { HiPlus, HiSearch } from "react-icons/hi";
import type { SortOption } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { CreatePlaythroughModal } from "@/comps/modals/CreatePlaythroughModal";
import PlaythroughCard from "./PlaythroughCard";

export default function PlaythroughListPage() {
	const { playthroughs } = usePlaythrough();
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState<SortOption>("lastModified");
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const filtered = useMemo(() => {
		let result = [...playthroughs];

		if (searchQuery) {
			result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
		}

		switch (sortOption) {
			case "name":
				result.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case "createdAt":
				result.sort(
					(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
				break;
			case "lastModified":
			default:
				result.sort(
					(a, b) =>
						new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
				);
		}

		return result;
	}, [playthroughs, searchQuery, sortOption]);

	return (
		<div className="p-6">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1
						className="text-3xl font-bold text-gray-900 dark:text-white"
						style={{ fontFamily: "var(--font-stardew-valley)" }}
					>
						My Playthroughs
					</h1>
					<p className="mt-1 text-gray-600 dark:text-gray-400">
						Manage your playthroughs and track your progress
					</p>
				</div>
				<Button onClick={() => setIsCreateModalOpen(true)} color="accent">
					<HiPlus className="mr-2 h-5 w-5" />
					New Playthrough
				</Button>
			</div>

			{playthroughs.length > 0 && (
				<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
					<div className="relative flex-1">
						<TextInput
							icon={HiSearch}
							placeholder="Search playthroughs..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm text-gray-500 dark:text-gray-400">Sort:</span>
						{(["lastModified", "name", "createdAt"] as SortOption[]).map((opt) => (
							<button
								key={opt}
								onClick={() => setSortOption(opt)}
								className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-colors ${
									sortOption === opt
										? "bg-accent text-white"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
								}`}
							>
								{opt === "lastModified"
									? "Last Modified"
									: opt === "createdAt"
										? "Date Created"
										: "Name"}
							</button>
						))}
					</div>
				</div>
			)}

			{playthroughs.length > 0 && searchQuery && (
				<p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
					Showing{" "}
					<Badge color="accent" className="inline-flex">
						{filtered.length}
					</Badge>{" "}
					of {playthroughs.length} playthroughs
				</p>
			)}

			{playthroughs.length === 0 ? (
				<Card className="py-16 text-center">
					<div className="mx-auto max-w-md">
						<h2 className="mb-4 text-xl font-medium text-gray-700 dark:text-gray-300">
							No Playthroughs Yet
						</h2>
						<p className="mb-6 text-gray-600 dark:text-gray-400">
							Create your first playthrough to start tracking your progress!
						</p>
						<div className="flex justify-center">
							<Button
								onClick={() => setIsCreateModalOpen(true)}
								color="accent"
								size="lg"
							>
								<HiPlus className="mr-2 h-5 w-5" />
								Create Your First Playthrough
							</Button>
						</div>
					</div>
				</Card>
			) : filtered.length === 0 ? (
				<Card className="py-12 text-center">
					<p className="text-gray-500 dark:text-gray-400">
						No playthroughs match &quot;{searchQuery}&quot;
					</p>
				</Card>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filtered.map((playthrough) => (
						<PlaythroughCard key={playthrough.id} playthrough={playthrough} />
					))}
				</div>
			)}

			<CreatePlaythroughModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
			/>
		</div>
	);
}
