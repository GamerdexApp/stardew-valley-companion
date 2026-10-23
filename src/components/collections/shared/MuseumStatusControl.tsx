import { collectionsText } from "@/lib/messages/collections";
import type { MuseumStatus } from "@/service/museum";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";

const text = collectionsText.museum;

interface MuseumStatusControlProps {
	name: string;
	status: MuseumStatus;
	onChange: (status: MuseumStatus) => void;
}

/** One control for an artifact or mineral. It cannot reach a state the museum does not have. */
export function MuseumStatusControl({ name, status, onChange }: MuseumStatusControlProps) {
	return (
		<SegmentedControl
			label={text.statusLabel(name)}
			value={status}
			onChange={onChange}
			fullWidth
			options={[
				{ id: "missing", label: text.status.missing },
				{ id: "found", label: text.status.found },
				{ id: "donated", label: text.status.donated },
			]}
		/>
	);
}
