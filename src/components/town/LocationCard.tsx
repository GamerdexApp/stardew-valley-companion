import type { GameLocation } from "stardew-valley-data";
import { useState } from "react";
import { townText } from "@/lib/messages/town";
import { assetPath } from "@/lib/utils/assetPath";
import { capitalize } from "@/lib/utils/formatting";
import { hoursOf, locationThumb } from "@/service/town";
import { Badge } from "@/comps/ui/Badge";
import { Card } from "@/comps/ui/Card";
import { ExpandableDetails } from "@/comps/ui/ExpandableDetails";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { ShopDetails } from "./ShopDetails";

const text = townText;

function Fact({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-0.5">
			<SectionLabel className="text-muted">{label}</SectionLabel>
			<span className="text-sm font-medium">{value}</span>
		</div>
	);
}

export function LocationCard({ location }: { location: GameLocation }) {
	const [thumbFailed, setThumbFailed] = useState(false);
	const hours = hoursOf(location);
	const closed = location.closed.join(", ");

	return (
		<Card className="flex flex-col gap-2 p-3">
			<div className="flex items-start gap-3">
				<img
					loading="lazy"
					decoding="async"
					src={assetPath(thumbFailed ? location.image : locationThumb(location))}
					onError={() => setThumbFailed(true)}
					alt=""
					width={40}
					height={40}
					className="size-10 shrink-0 object-contain [image-rendering:pixelated]"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="font-semibold">{location.name}</span>
					{location.address && (
						<span className="text-muted text-xs">{location.address}</span>
					)}
				</div>
				<Badge tone={location.shop ? "added" : "locked"}>
					{location.shop ? text.card.shop : text.card.location}
				</Badge>
			</div>
			<p className="text-muted text-sm">
				{hours ?? text.card.alwaysOpen}
				{closed && ` · ${text.card.closed(closed)}`}
			</p>
			<p className="text-sm">
				{location.occupants.length > 0
					? text.card.occupants(location.occupants)
					: text.card.noOccupants}
			</p>
			<ExpandableDetails showLabel={text.card.showDetails} hideLabel={text.card.hideDetails}>
				<div className="grid grid-cols-2 gap-3">
					<Fact label={text.facts.hours} value={hours ?? text.card.alwaysOpen} />
					<Fact label={text.facts.closed} value={closed || text.facts.never} />
					<Fact
						label={text.facts.occupants}
						value={
							location.occupants.length > 0
								? location.occupants.join(", ")
								: text.card.noOccupants
						}
					/>
					<Fact label={text.facts.type} value={capitalize(location.type)} />
				</div>
				{location.shop === "joja-shop" && (
					<div className="bg-tint flex flex-col gap-0.5 rounded-md p-3">
						<span className="text-sm font-semibold">{text.facts.jojaMembership}</span>
						<span className="text-muted text-sm">{text.facts.jojaBody}</span>
					</div>
				)}
				{location.shop && <ShopDetails location={location} />}
			</ExpandableDetails>
		</Card>
	);
}
