import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { STORAGE_KEY } from "@/service/storage";
import { ThemeSync } from "@/comps/layout/ThemeSync";
import { ToastProvider } from "@/comps/ui/Toast";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
	variable: "--font-plex-sans",
	subsets: ["latin"],
	weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
	variable: "--font-plex-mono",
	subsets: ["latin"],
	weight: ["400", "500"],
});

const stardewValley = localFont({
	src: [
		{ path: "../../public/fonts/svthin.otf.woff2", weight: "400", style: "normal" },
		{ path: "../../public/fonts/svbold.otf.woff2", weight: "700", style: "normal" },
	],
	variable: "--font-stardew-valley",
	display: "swap",
});

// Runs before the first paint so a dark theme never flashes light.
const applyThemeBeforePaint = `try{var s=JSON.parse(localStorage.getItem("${STORAGE_KEY}")||"{}").settings;var t=s&&s.theme||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}`;

const siteUrl = "https://stardew-valley.gamerdex.app";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: "Stardew Valley Companion",
		template: "%s | Stardew Valley Companion",
	},
	description:
		"A free progress tracker for Stardew Valley. Track bundles, friendships, fish, crops, minerals, artifacts, skills, and more across multiple playthroughs.",
	keywords: [
		"Stardew Valley",
		"Stardew Valley tracker",
		"Stardew Valley companion",
		"Stardew Valley progress",
		"community center tracker",
		"Stardew Valley bundles",
		"Stardew Valley fishing",
		"Stardew Valley perfection",
		"farm tracker",
	],
	authors: [{ name: "GamerDex" }],
	creator: "GamerDex",
	alternates: {
		canonical: "/",
	},
	robots: {
		index: true,
		follow: true,
	},
	manifest: "/site.webmanifest",
	icons: {
		icon: [
			{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		apple: "/apple-touch-icon.png",
		other: [
			{ rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
			{ rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
		],
	},
	openGraph: {
		type: "website",
		siteName: "Stardew Valley Companion",
		title: "Stardew Valley Companion",
		description:
			"A free progress tracker for Stardew Valley. Track bundles, friendships, fish, crops, minerals, artifacts, skills, and more across multiple playthroughs.",
		url: siteUrl,
		images: [
			{
				url: "/Site Screenshot.png",
				width: 1919,
				height: 920,
				alt: "Stardew Valley Companion dashboard preview",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Stardew Valley Companion",
		description:
			"A free progress tracker for Stardew Valley. Track bundles, friendships, fish, crops, minerals, artifacts, skills, and more across multiple playthroughs.",
		images: ["/Site Screenshot.png"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: applyThemeBeforePaint }} />
			</head>
			<body
				className={`${plexSans.variable} ${plexMono.variable} ${stardewValley.variable} bg-bg min-h-dvh antialiased`}
			>
				<UIProvider>
					<ToastProvider>
						<PlaythroughProvider>
							<ThemeSync />
							{children}
						</PlaythroughProvider>
					</ToastProvider>
				</UIProvider>
			</body>
		</html>
	);
}
