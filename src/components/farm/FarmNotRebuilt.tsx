import { farmText } from "@/lib/messages/farm";
import type { FarmTabId } from "@/data/farm";
import { ButtonLink } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";

const text = farmText.notRebuilt;

/** A tab that is not rebuilt yet. Its old page still works and is one link away. */
export function FarmNotRebuilt({ tab }: { tab: FarmTabId }) {
	return (
		<EmptyState
			title={text.title}
			description={text.body}
			actions={<ButtonLink href={`/farm/${tab}`}>{text.open}</ButtonLink>}
		/>
	);
}
