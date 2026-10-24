"use client";

import type { Artifact } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import type { MuseumStatus } from "@/service/museum";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { MuseumStatusControl } from "../shared/MuseumStatusControl";
import { QualityPrices } from "../shared/QualityPrices";

const text = collectionsText.artifacts;
const copy = text.dialog;

interface ArtifactDialogProps {
	artifact: Artifact | null;
	status: MuseumStatus;
	onStatusChange: (status: MuseumStatus) => void;
	onClose: () => void;
}

export function ArtifactDialog({ artifact, status, onStatusChange, onClose }: ArtifactDialogProps) {
	return (
		<Dialog
			open={artifact !== null}
			onClose={onClose}
			title={artifact?.name ?? ""}
			footer={<Button onClick={onClose}>{copy.close}</Button>}
		>
			{artifact && (
				<>
					<div className="flex items-center gap-3">
						<img
							loading="lazy"
							decoding="async"
							src={assetPath(artifact.image)}
							alt=""
							className="size-14 shrink-0 object-contain [image-rendering:pixelated]"
						/>
						<span className="text-muted text-xs font-medium">{copy.type}</span>
					</div>
					<section className="flex flex-col gap-1.5">
						<h3 className="font-semibold">{copy.status}</h3>
						<MuseumStatusControl
							name={artifact.name}
							status={status}
							onChange={onStatusChange}
						/>
						<p className="text-muted text-xs">
							{collectionsText.museum.donatedIncludesFound}
						</p>
					</section>
					<p className="text-muted italic">{artifact.description}</p>
					<section className="flex flex-col gap-2">
						<h3 className="font-semibold">{copy.sellPrice}</h3>
						<QualityPrices price={artifact.sellPrice} maxQuality="base" />
					</section>
					<section className="flex flex-col gap-2">
						<h3 className="font-semibold">{copy.howToFind}</h3>
						<ul className="flex flex-col gap-1.5">
							{artifact.locations.map((location) => (
								<li key={location} className="bg-bg rounded-md px-3 py-2">
									{location}
								</li>
							))}
						</ul>
					</section>
					{artifact.donationNotes && (
						<section className="bg-bg flex flex-col gap-1 rounded-md px-3 py-2.5">
							<SectionLabel className="text-changed">
								{copy.museumReward}
							</SectionLabel>
							<p>{artifact.donationNotes}</p>
						</section>
					)}
				</>
			)}
		</Dialog>
	);
}
