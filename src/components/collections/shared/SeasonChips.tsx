import type { Season } from "stardew-valley-data";

const SEASONS: Record<string, { abbr: string; name: string; tone: string }> = {
	spring: { abbr: "Sp", name: "Spring", tone: "text-kept" },
	summer: { abbr: "Su", name: "Summer", tone: "text-gold" },
	fall: { abbr: "Fa", name: "Fall", tone: "text-warn" },
	winter: { abbr: "Wi", name: "Winter", tone: "text-added" },
	"ginger island": { abbr: "GI", name: "Ginger Island", tone: "text-fixed" },
};

export function SeasonChips({ seasons }: { seasons: (Season | string)[] }) {
	return (
		<>
			{seasons.map((season) => {
				const meta = SEASONS[season];
				return (
					<span
						key={season}
						title={meta?.name ?? season}
						className={`inline-flex h-5 min-w-6 items-center justify-center rounded border-[1.5px] border-current px-1 font-mono text-[11px] font-medium ${meta?.tone ?? "text-muted"}`}
					>
						<span aria-hidden="true">{meta?.abbr ?? season.slice(0, 2)}</span>
						<span className="sr-only">{meta?.name ?? season}</span>
					</span>
				);
			})}
		</>
	);
}
