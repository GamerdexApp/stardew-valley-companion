"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { EditStep, JojaEditDraft } from "@/types";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { assetPath } from "@/lib/utils/assetPath";
import { NAVY_TILE } from "@/data/constants/styles";
import { DevelopmentsSection } from "@/comps/joja/DevelopmentsSection";
import { JojaEditStep } from "@/comps/joja/edit";
import { JojaHero } from "@/comps/joja/JojaHero";
import { EditModal } from "@/comps/modals/CreatePlaythroughModal";
import { NoPlaythroughFallback } from "@/comps/ui/NoPlaythroughFallback";
import { PageHeader } from "@/comps/ui/PageHeader";

function JojaContent() {
	const { activePlaythrough, updatePlaythrough, isManualPlaythrough } = usePlaythrough();
	const searchParams = useSearchParams();
	const devOverride = searchParams.get("dev") === "true";
	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<JojaEditDraft | null>(null);

	if (!activePlaythrough) {
		return <NoPlaythroughFallback feature="joja development" />;
	}

	if (!devOverride && !activePlaythrough.data.joja?.isMember) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center p-6">
				<div className="text-center">
					<div className="text-lg font-bold text-gray-500">Not a Joja Member</div>
					<p className="mt-2 text-sm text-gray-600">
						You chose the Community Center route.
					</p>
					<Link
						href="/community-center"
						className="bg-primary hover:bg-primary/80 mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
					>
						Go to Community Center
					</Link>
				</div>
			</div>
		);
	}

	const gameData = activePlaythrough.data;
	const playthroughId = activePlaythrough.id;

	function handleOpenEdit() {
		setDraft({
			joja: {
				...gameData.joja,
				developments: { ...gameData.joja.developments },
			},
		});
		setEditOpen(true);
	}

	function handleSave() {
		if (!draft) return;
		updatePlaythrough(playthroughId, {
			data: { ...gameData, joja: draft.joja },
		});
	}

	const editSteps: EditStep[] = draft
		? [
				{
					label: "Joja",
					content: (
						<JojaEditStep
							joja={draft.joja}
							onChange={(joja) => setDraft((d) => d && { ...d, joja })}
						/>
					),
				},
			]
		: [];

	return (
		<div className="p-6">
			<PageHeader
				title="Joja Community Development"
				description="Joja Mart community development projects"
				onEdit={isManualPlaythrough ? handleOpenEdit : undefined}
			/>

			<div className="flex flex-col gap-6">
				<div className="flex items-center gap-4 rounded-lg p-4" style={NAVY_TILE}>
					<img
						src={assetPath("images/shop/Joja Development Form.png")}
						alt="Joja Membership"
						className="h-12 w-12 shrink-0 object-contain"
					/>
					<div className="flex-1">
						<div className="text-sm font-bold text-white">Joja Membership</div>
						<div className="text-[0.7rem] text-white/80">
							Active member — community development projects available
						</div>
					</div>
					<span
						className={`text-sm font-bold ${gameData.joja?.isMember ? "text-green-400" : "text-white/80"}`}
					>
						{gameData.joja?.isMember ? "Active" : "Inactive"}
					</span>
				</div>

				<JojaHero gameData={gameData} />
				<DevelopmentsSection gameData={gameData} />
			</div>

			<EditModal
				isOpen={editOpen}
				onClose={() => setEditOpen(false)}
				title="Edit Joja Progress"
				steps={editSteps}
				onSave={handleSave}
			/>
		</div>
	);
}

export default function JojaPage() {
	return (
		<Suspense>
			<JojaContent />
		</Suspense>
	);
}
