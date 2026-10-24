import { communityCenterText } from "@/lib/messages/communityCenter";
import type { Route } from "@/service/communityCenter";
import { ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";

const text = communityCenterText.decision;

/** The route is chosen in Settings, so the page only says which one it is and links there. */
export function DecisionCard({ route }: { route: Route }) {
	return (
		<Card className="flex flex-wrap items-center justify-between gap-3 p-4">
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<h2 className="text-base font-semibold">{text.title}</h2>
				<p className="text-muted text-sm">{text.body[route]}</p>
			</div>
			<ButtonLink href="/settings" variant="secondary">
				{text.change}
			</ButtonLink>
		</Card>
	);
}
