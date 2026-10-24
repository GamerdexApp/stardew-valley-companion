import { collectionsText } from "@/lib/messages/collections";
import type { RecipeKind, RecipeStatus } from "@/service/recipes";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";

const text = collectionsText.recipes;

interface RecipeStatusControlProps {
	kind: RecipeKind;
	name: string;
	status: RecipeStatus;
	onChange: (status: RecipeStatus) => void;
}

/** One control for a recipe. It cannot reach a state the game does not have. */
export function RecipeStatusControl({ kind, name, status, onChange }: RecipeStatusControlProps) {
	return (
		<SegmentedControl
			label={text.statusLabel(name)}
			value={status}
			onChange={onChange}
			fullWidth
			options={[
				{ id: "not-learned", label: text.notLearned },
				{ id: "learned", label: text.learned },
				{ id: "done", label: text.doneLabel[kind] },
			]}
		/>
	);
}
