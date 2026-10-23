"use client";

import { Button } from "flowbite-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaTrophy } from "react-icons/fa";
import {
	HiCalendar,
	HiChevronDown,
	HiChevronUp,
	HiInformationCircle,
	HiTemplate,
	HiUpload,
} from "react-icons/hi";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";

const FEATURES = [
	{
		icon: <img src="/images/skills/Farming.png" className="h-8 w-8 object-contain" alt="" />,
		title: "Dashboard",
		description:
			"An at-a-glance overview of your entire playthrough: stats, skills, progress, and perfection score.",
	},
	{
		icon: (
			<img
				src="/images/bundles/icons/Bundle Green.png"
				className="h-8 w-8 object-contain"
				alt=""
			/>
		),
		title: "Community Center",
		description:
			"Track every bundle room and donation. See exactly what you still need to complete the Community Center.",
	},
	{
		icon: <img src="/images/skills/Fishing.png" className="h-8 w-8 object-contain" alt="" />,
		title: "Collections",
		description:
			"Monitor fish, crops, minerals, artifacts, cooking, and crafting with progress bars for every category.",
	},
	{
		icon: <img src="/images/villagers/Abigail.png" className="h-8 w-8 object-contain" alt="" />,
		title: "Villagers",
		description:
			"Track heart levels for every villager. See who needs more attention and who is maxed out.",
	},
	{
		icon: <img src="/images/skills/Combat.png" className="h-8 w-8 object-contain" alt="" />,
		title: "Skills & Tools",
		description:
			"Level tracking for all 5 skills and tool upgrades. See professions and mastery status at a glance.",
	},
	{
		icon: <img src="/images/skills/Mining.png" className="h-8 w-8 object-contain" alt="" />,
		title: "Mines & Monsters",
		description:
			"Track mine depth, Skull Cavern progress, key items, and monster slayer goals all in one place.",
	},
	{
		icon: <FaTrophy className="text-primary h-7 w-7" />,
		title: "Perfection Tracker",
		description:
			"A full breakdown of your perfection score across all 11 categories, with waiver tracking.",
	},
	{
		icon: <HiCalendar className="text-primary h-7 w-7" />,
		title: "Seasonal Calendar",
		description:
			"See which crops, fish, and events are available for the current season and plan ahead.",
	},
	{
		icon: <HiUpload className="text-primary h-7 w-7" />,
		title: "Save File Import",
		description:
			"Upload your Stardew save file and it will be parsed automatically. No manual entry needed.",
	},
];

const STEPS = [
	{
		number: 1,
		title: "Create a Playthrough",
		description:
			"Upload your Stardew Valley save file for automatic import. Or start manually with your farm name and bundles. Full manual editing is coming soon.",
	},
	{
		number: 2,
		title: "Track Your Progress",
		description:
			"Update collections, heart levels, bundles, skills, and milestones as you play, at your own pace.",
	},
	{
		number: 3,
		title: "See Your Dashboard",
		description:
			"Get a full overview of your farm at any time. See what is done, what is left, and how close you are to perfection.",
	},
];

const FAQS = [
	{
		question: "What is Stardew Valley Companion?",
		answer: "A free progress tracking tool for Stardew Valley. It helps you manage multiple farm saves and track bundles, friendships, fish, artifacts, skills, and more. No account required.",
	},
	{
		question: "How does it store my data?",
		answer: "All your data is stored locally in your browser using localStorage. Nothing is sent to any server. You can export your data as a JSON file for backup and re-import it anytime.",
	},
	{
		question: "Can I track multiple playthroughs?",
		answer: "Yes. Create and manage as many playthroughs as you want. Each one has its own independent progress. Switch between them at any time from the sidebar dropdown.",
	},
	{
		question: "How do I import my save file?",
		answer: "Find your save file on your computer (Windows: %AppData%\\StardewValley\\Saves, Mac: ~/.config/StardewValley/Saves), then upload the XML file when creating a new playthrough. The app parses it automatically.",
	},
	{
		question: "Is it free to use?",
		answer: "Completely free. No subscriptions, no ads, no hidden costs.",
	},
];

export default function Home() {
	const [openFaq, setOpenFaq] = useState<number | null>(null);
	const router = useRouter();
	const { activePlaythrough } = usePlaythrough();

	const [allowHome] = useState(() => {
		if (typeof window === "undefined") return false;
		const flag = sessionStorage.getItem("explicit-home") === "1";
		if (flag) sessionStorage.removeItem("explicit-home");
		return flag;
	});

	useEffect(() => {
		if (allowHome || !activePlaythrough) return;
		router.replace("/dashboard");
	}, [activePlaythrough, router, allowHome]);

	return (
		<div className="mx-auto max-w-5xl px-6 py-12">
			<div className="flex flex-col gap-20">
				<section className="flex flex-col items-center text-center">
					<p className="text-primary text-xs font-bold tracking-widest uppercase">
						Stardew Valley Companion
					</p>
					<h1 className="max-w-xl text-4xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-5xl">
						Track every detail of your <span className="text-primary">farm</span>
					</h1>
					<p className="max-w-lg text-[1.0625rem] leading-relaxed text-gray-500">
						A companion app for Stardew Valley players. Manage multiple playthroughs and
						track bundles, friendships, collections, skills, and more. All in one place.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-3">
						{activePlaythrough ? (
							<>
								<Button as={Link} href="/dashboard" color="primary" size="lg">
									<HiTemplate className="mr-2 h-4 w-4" />
									Go to Dashboard
								</Button>
								<Link
									href="/playthrough/list"
									className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
								>
									Playthroughs
								</Link>
							</>
						) : (
							<>
								<Button
									as={Link}
									href="/playthrough/list"
									color="primary"
									size="lg"
								>
									Get Started
								</Button>
								<a
									href="#features"
									className="text-sm font-semibold text-gray-700 hover:text-gray-900"
								>
									Learn more &rarr;
								</a>
							</>
						)}
					</div>
					<p className="text-xs text-gray-400">
						Free and private. All data stays in your browser.
					</p>
					<div className="mt-10 w-full overflow-hidden rounded-2xl border border-[#d6d0bc] shadow-xl">
						<img
							src="/Site Screenshot.png"
							alt="Stardew Valley Companion dashboard preview"
							className="w-full"
						/>
					</div>
				</section>

				<section id="features">
					<div className="mb-8 text-center">
						<p className="text-primary text-xs font-bold tracking-widest uppercase">
							What you can track
						</p>
						<h2 className="mt-2 text-3xl font-extrabold text-gray-900">
							Everything your farm needs
						</h2>
						<p className="mt-3 text-[0.9375rem] text-gray-500">
							From bundles to friendships, skills to collections. It is all here.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{FEATURES.map(({ icon, title, description }) => (
							<div
								key={title}
								className="flex flex-col gap-3 rounded-xl border border-[#d6d0bc] bg-white p-5 shadow-sm"
							>
								<div className="flex h-10 w-10 items-center justify-center">
									{icon}
								</div>
								<div>
									<p className="font-bold text-gray-900">{title}</p>
									<p className="mt-1 text-[0.8125rem] leading-relaxed text-gray-500">
										{description}
									</p>
								</div>
							</div>
						))}
					</div>

					<div className="mt-5 flex gap-4 rounded-xl border border-[#d6d0bc] bg-white p-4 shadow-sm">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center">
							<HiInformationCircle className="text-accent h-5 w-5" />
						</div>
						<div>
							<p className="text-sm font-bold text-gray-900">
								Save file import gives you the full experience
							</p>
							<p className="mt-1 text-[0.8125rem] leading-relaxed text-gray-500">
								Most tracking requires uploading your Stardew Valley save file from
								your PC. Right now, manual playthrough creation supports setting up
								your farm name, character name, and Community Center bundles only.
								Full manual tracking is coming in a future update.
							</p>
							<span className="border-primary/20 bg-primary/10 text-primary mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[0.7rem] font-bold">
								Full editing coming soon
							</span>
						</div>
					</div>
				</section>

				<section>
					<div
						className="border-secondary/60 rounded-xl border p-8"
						style={{ background: "linear-gradient(135deg, #1e2538 0%, #2b3a67 100%)" }}
					>
						<div className="text-center">
							<p className="text-highlight text-xs font-bold tracking-widest uppercase">
								Simple to start
							</p>
							<h2 className="mt-2 text-2xl font-extrabold text-white">
								Get started in minutes
							</h2>
							<p className="mt-2 text-[0.9rem] text-white/60">
								No account required. Everything is stored locally in your browser.
							</p>
						</div>

						<div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
							{STEPS.map(({ number, title, description }) => (
								<div key={number} className="flex flex-col gap-3">
									<div className="bg-accent flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-white">
										{number}
									</div>
									<div>
										<p className="font-bold text-white">{title}</p>
										<p className="mt-1 text-[0.8125rem] leading-relaxed text-white/60">
											{description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				<section>
					<div className="mb-8 text-center">
						<p className="text-primary text-xs font-bold tracking-widest uppercase">
							Got questions?
						</p>
						<h2 className="mt-2 text-3xl font-extrabold text-gray-900">
							Frequently asked questions
						</h2>
					</div>

					<div className="divide-y divide-gray-200 border-t border-gray-200">
						{FAQS.map(({ question, answer }, i) => (
							<div key={i}>
								<button
									type="button"
									onClick={() => setOpenFaq(openFaq === i ? null : i)}
									className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
									aria-expanded={openFaq === i}
								>
									<span className="font-semibold text-gray-900">{question}</span>
									<span className="bg-surface flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#d6d0bc] text-gray-500">
										{openFaq === i ? (
											<HiChevronUp className="h-3.5 w-3.5" />
										) : (
											<HiChevronDown className="h-3.5 w-3.5" />
										)}
									</span>
								</button>
								{openFaq === i && (
									<p className="pb-5 text-sm leading-relaxed text-gray-500">
										{answer}
									</p>
								)}
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
