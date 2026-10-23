import Link from "next/link";
import { FaDiscord, FaGithub, FaRegCopyright } from "react-icons/fa6";

export function Footer() {
	return (
		<footer className="bg-primary p-6 text-white">
			<div className="mx-auto max-w-7xl">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
					<div className="col-span-1 md:col-span-2">
						<Link href="/" className="mb-4 flex items-center gap-3">
							<img
								src="/gamerdex-icon.svg"
								className="h-8 w-8"
								alt="Stardew Valley Companion"
							/>
							<span className="self-center text-xl font-semibold whitespace-nowrap">
								Stardew Valley Companion
							</span>
						</Link>
						<p className="my-4 text-sm font-light text-white">
							A free progress tracker for Stardew Valley players. Manage multiple
							playthroughs, track bundles, friendships, collections, skills, and more.
							All saved locally in your browser.
						</p>
						<ul className="mt-5 flex space-x-6">
							<li>
								<a
									href="https://github.com/chiefpansancolt/stardew-vally-companion"
									className="text-white hover:text-white"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FaGithub className="h-5 w-5" />
									<span className="sr-only">GitHub</span>
								</a>
							</li>
							<li>
								<a
									href="https://discord.gg/3qe4dS6pmT"
									className="text-white hover:text-white"
									target="_blank"
									rel="noopener noreferrer"
								>
									<FaDiscord className="h-5 w-5" />
									<span className="sr-only">Discord</span>
								</a>
							</li>
						</ul>
					</div>

					<div>
						<h2 className="mb-6 text-sm font-semibold tracking-wider text-white uppercase">
							Resources
						</h2>
						<ul>
							<li className="mb-4">
								<a
									href="https://stardewvalleywiki.com"
									className="text-sm text-white hover:text-white"
									target="_blank"
									rel="noopener noreferrer"
								>
									Stardew Valley Wiki
								</a>
							</li>
							<li className="mb-4">
								<Link
									href="/settings"
									className="text-sm text-white hover:text-white"
								>
									Settings
								</Link>
							</li>
							<li>
								<a
									href="https://gamerdex.app"
									className="text-sm text-white hover:text-white"
									target="_blank"
									rel="noopener noreferrer"
								>
									GamerDex
								</a>
							</li>
						</ul>
					</div>

					<div>
						<ul>
							<li className="mb-4 text-xs leading-relaxed text-white">
								This project is not affiliated with, endorsed by, or connected to
								ConcernedApe or Stardew Valley.
							</li>
							<li className="text-xs leading-relaxed text-white">
								Game images and names are used for reference purposes only.
							</li>
						</ul>
					</div>
				</div>

				<hr className="my-6 border-white lg:my-8" />

				<div className="text-center">
					<span className="flex items-center justify-center gap-1 text-xs text-white">
						<FaRegCopyright className="h-3 w-3" />
						{new Date().getFullYear()} Stardew Valley Companion. All Rights Reserved.
					</span>
				</div>
			</div>
		</footer>
	);
}
