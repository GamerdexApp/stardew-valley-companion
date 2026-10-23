import { collectionsText } from "@/lib/messages/collections";
import { assetPath } from "@/lib/utils/assetPath";

const text = collectionsText.farmShared.seed;

interface SeedRowProps {
	image: string;
	name: string;
	prices: { place: string; price: number }[];
}

/** The seed of a crop or tree with the price in each shop. */
export function SeedRow({ image, name, prices }: SeedRowProps) {
	return (
		<div className="bg-bg flex items-center gap-2.5 rounded-md px-2.5 py-1.5">
			<img
				src={assetPath(image)}
				alt=""
				className="size-6 shrink-0 object-contain [image-rendering:pixelated]"
			/>
			<div className="flex min-w-0 flex-col">
				<span className="text-xs font-medium">{name}</span>
				<span className="text-muted text-xs">
					{prices.length === 0
						? text.noShop
						: prices.map(({ place, price }) => text.price(place, price)).join(" · ")}
				</span>
			</div>
		</div>
	);
}
