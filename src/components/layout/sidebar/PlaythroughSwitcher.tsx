import { Dropdown, DropdownDivider, DropdownHeader, DropdownItem } from "flowbite-react";
import { useRouter } from "next/navigation";
import { LuChevronsUpDown, LuPlus } from "react-icons/lu";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { getFarmIcon } from "@/lib/utils/farmIcon";
import { NEW_PLAYTHROUGH_HREF } from "@/data/nav";

export function PlaythroughSwitcher() {
	const { playthroughs, activePlaythrough, setActivePlaythrough } = usePlaythrough();
	const router = useRouter();

	const handlePlaythroughSelect = (playthroughId: string) => {
		if (activePlaythrough?.id === playthroughId) return;
		setActivePlaythrough(playthroughId);
	};

	return (
		<>
			<div className="mb-2">
				<Dropdown
					dismissOnClick={true}
					renderTrigger={() => (
						<button
							type="button"
							className="hover:bg-primary/30 focus:ring-primary/30 dark:hover:bg-primary/30 dark:focus:ring-primary/40 flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-left focus:ring-2 focus:outline-none"
						>
							{activePlaythrough ? (
								<img
									src={getFarmIcon(activePlaythrough.data.character.farmType)}
									alt="Farm type"
									className="h-8 w-auto shrink-0"
								/>
							) : (
								<div className="bg-primary flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white">
									?
								</div>
							)}
							<div className="min-w-0 flex-1">
								<span className="truncate text-sm font-medium text-white">
									{activePlaythrough?.name || "None Selected"}
								</span>
							</div>
							<LuChevronsUpDown className="size-4 shrink-0 text-white/70" />
						</button>
					)}
				>
					<DropdownHeader>Playthroughs</DropdownHeader>
					{playthroughs.length === 0 ? (
						<DropdownItem disabled>No playthroughs yet</DropdownItem>
					) : (
						playthroughs.map((playthrough) => (
							<DropdownItem
								key={playthrough.id}
								onClick={() => handlePlaythroughSelect(playthrough.id)}
							>
								<div className="flex w-full items-center gap-2">
									<img
										src={getFarmIcon(playthrough.data.character.farmType)}
										alt="Farm type"
										className="h-5 w-auto shrink-0"
									/>
									<span className="truncate">{playthrough.name}</span>
									{activePlaythrough?.id === playthrough.id && (
										<span className="text-primary dark:text-primary/80 ml-auto text-xs font-medium">
											Active
										</span>
									)}
								</div>
							</DropdownItem>
						))
					)}
					<DropdownDivider />
					<DropdownItem onClick={() => router.push(NEW_PLAYTHROUGH_HREF)}>
						<div className="flex items-center gap-2">
							<div className="flex size-6 items-center justify-center rounded-md border border-gray-300 bg-transparent dark:border-gray-600">
								<LuPlus className="size-4" />
							</div>
							<span className="font-medium text-gray-500 dark:text-gray-400">
								Add Playthrough
							</span>
						</div>
					</DropdownItem>
				</Dropdown>
			</div>
		</>
	);
}
