import { collectionsText } from "@/lib/messages/collections";
import type { CollectionTabId } from "@/data/collections";
import { ButtonLink } from "@/comps/ui/Button";
import { EmptyState } from "@/comps/ui/EmptyState";

const text = collectionsText.notRebuilt;

/** A tab that is not rebuilt yet. Its old page still works and is one link away. */
export function NotRebuiltTab({ tab }: { tab: CollectionTabId }) {
	const hasOldPage = tab !== "overview";
	return (
		<EmptyState
			title={text.title}
			description={hasOldPage ? text.body : ""}
			actions={
				hasOldPage ? (
					<ButtonLink href={`/collections/${tab}`}>{text.open}</ButtonLink>
				) : undefined
			}
		/>
	);
}
