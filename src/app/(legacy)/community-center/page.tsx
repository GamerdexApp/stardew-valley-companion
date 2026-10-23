"use client";

import { Alert } from "flowbite-react";
import Link from "next/link";
import { useState } from "react";
import { HiInformationCircle } from "react-icons/hi";
import type { CommunityCenterEditDraft, EditStep } from "@/types";
import type { CommunityCenterRooms } from "@/types/app/game";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { CC_ROOMS, ROOM_LABELS, ROOM_TO_CC_KEY } from "@/data/constants/bundles";
import { CCHero } from "@/comps/community-center/CCHero";
import { BundleRoomEditStep } from "@/comps/community-center/edit";
import { RoomSections } from "@/comps/community-center/RoomSection";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function CommunityCenterPage() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<CommunityCenterEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="community center" />;
	}

	if (activePlaythrough.data.joja?.isMember) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center p-6">
				<div className="text-center">
					<div className="text-lg font-bold text-gray-500">Joja Member</div>
					<p className="mt-2 text-sm text-gray-600">You chose the Joja route.</p>
					<Link
						href="/joja"
						className="bg-primary hover:bg-primary/80 mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
					>
						Go to Joja Development
					</Link>
				</div>
			</div>
		);
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		const bundlesCopy: Record<string, Record<string, boolean>> = {};
		for (const [id, items] of Object.entries(gameData.bundles)) {
			bundlesCopy[id] = { ...items };
		}
		setDraft({
			bundles: bundlesCopy,
			communityCenter: {
				...gameData.communityCenter,
				rooms: { ...gameData.communityCenter.rooms },
			},
		});
		setEditOpen(true);
	}

	function handleSave() {
		if (!draft) return;
		updatePlaythrough(playthroughId, {
			data: {
				...gameData,
				bundles: draft.bundles,
				communityCenter: draft.communityCenter,
			},
		});
	}

	const editSteps: EditStep[] = draft
		? CC_ROOMS.map((room) => {
				const ccKey = ROOM_TO_CC_KEY[room] as keyof CommunityCenterRooms;
				return {
					label: ROOM_LABELS[room] ?? room,
					content: (
						<BundleRoomEditStep
							room={room}
							bundles={draft.bundles}
							roomComplete={draft.communityCenter.rooms[ccKey] ?? false}
							onBundlesChange={(bundles) => setDraft((d) => d && { ...d, bundles })}
							onRoomCompleteChange={(complete) =>
								setDraft(
									(d) =>
										d && {
											...d,
											communityCenter: {
												...d.communityCenter,
												rooms: {
													...d.communityCenter.rooms,
													[ccKey]: complete,
												},
											},
										}
								)
							}
						/>
					),
				};
			})
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Community Center"
				description="Bundle progress and room completion"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				{gameData.communityCenter.completed && (
					<Alert color="info" icon={HiInformationCircle}>
						When the Community Center is fully completed, the save file no longer tracks
						which specific items were placed in each bundle slot. Item completion shown
						below may not reflect what was originally contributed.
					</Alert>
				)}
				<CCHero gameData={gameData} />
				<RoomSections gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Community Center"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}
