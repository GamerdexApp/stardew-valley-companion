import { LuHeart } from "react-icons/lu";
import { villagersText } from "@/lib/messages/villagers";

const text = villagersText.card;

export function HeartsRow({ hearts, max }: { hearts: number; max: number }) {
	return (
		<span
			role="img"
			aria-label={text.heartsRow(hearts, max)}
			className="flex flex-wrap gap-0.5"
		>
			{Array.from({ length: max }, (_, index) => (
				<LuHeart
					key={index}
					size={14}
					aria-hidden="true"
					className={index < hearts ? "fill-danger text-danger" : "text-muted"}
				/>
			))}
		</span>
	);
}
