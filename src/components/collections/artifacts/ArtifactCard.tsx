import type { Artifact } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";
import type { MuseumStatus } from "@/service/museum";
import { Card } from "@/comps/ui/Card";
import { MuseumStatusControl } from "../shared/MuseumStatusControl";
import { QualityPrices } from "../shared/QualityPrices";

const text = collectionsText.artifacts;

interface ArtifactCardProps {
	artifact: Artifact;
	status: MuseumStatus;
	onStatusChange: (status: MuseumStatus) => void;
	onOpen: () => void;
}

export function ArtifactCard({ artifact, status, onStatusChange, onOpen }: ArtifactCardProps) {
	const hasReward = artifact.donationNotes !== null;

	return (
		<Card
			highlighted={status === "donated"}
			className={`flex flex-col gap-2.5 p-3 ${status === "donated" ? "bg-tint" : ""}`}
		>
			<div className="flex items-start gap-3">
				<img
					loading="lazy"
					decoding="async"
					src={assetPath(artifact.image)}
					alt=""
					className="size-12 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<span className="font-semibold">{artifact.name}</span>
						{hasReward && (
							<span className="border-line text-changed rounded-md border-[1.5px] px-1.5 py-0.5 text-xs font-medium">
								{text.card.reward}
							</span>
						)}
					</span>
					<span className="text-muted text-xs">{artifact.locations[0]}</span>
				</div>
			</div>
			<MuseumStatusControl name={artifact.name} status={status} onChange={onStatusChange} />
			<QualityPrices price={artifact.sellPrice} maxQuality="base" />
			<button
				type="button"
				onClick={onOpen}
				aria-label={text.card.details(artifact.name)}
				className="text-link flex min-h-11 items-center self-start font-semibold underline-offset-2 hover:underline lg:min-h-6"
			>
				{hasReward ? text.card.locationsAndReward : text.card.locations}
			</button>
		</Card>
	);
}
