import { LuUpload, LuWrench } from "react-icons/lu";
import { newPlaythroughText } from "@/lib/messages/newPlaythrough";
import type { WizardPath } from "@/service/newPlaythrough";
import { PathTile } from "./PathTile";

const text = newPlaythroughText.choose;

export function ChoosePathStep({ onSelect }: { onSelect: (path: WizardPath) => void }) {
	return (
		<div className="flex flex-col gap-3">
			<h2 className="text-lg font-semibold">{text.heading}</h2>
			<div className="grid gap-4 sm:grid-cols-2">
				<PathTile
					icon={<LuUpload size={40} />}
					title={text.upload.title}
					body={text.upload.body}
					onSelect={() => onSelect("upload")}
				/>
				<PathTile
					icon={<LuWrench size={40} />}
					title={text.build.title}
					body={text.build.body}
					onSelect={() => onSelect("build")}
				/>
			</div>
		</div>
	);
}
