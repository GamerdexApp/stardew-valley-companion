import Image from "next/image";
import Link from "next/link";
import { shellText } from "@/lib/messages/shell";
import { APP_NAME, HOME_HREF } from "@/data/nav";

export function BrandMark({ onNavigate }: { onNavigate?: () => void }) {
	return (
		<Link href={HOME_HREF} onClick={onNavigate} className="flex min-h-11 items-center gap-2.5">
			<Image
				src="/stardew-valley-icon.png"
				alt=""
				width={32}
				height={32}
				className="block size-8 shrink-0 rounded-md"
			/>
			<span className="flex flex-col">
				<span className="font-brand text-sb-text text-[17px] leading-[1.1] font-bold">
					Stardew Valley
				</span>
				<span className="text-sb-muted font-mono text-[11px]">
					{shellText.brandSubtitle}
				</span>
			</span>
			<span className="sr-only">{APP_NAME}</span>
		</Link>
	);
}
