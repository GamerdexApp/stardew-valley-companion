import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Artifacts",
	description: "Track your Stardew Valley artifacts collection.",
	alternates: {
		canonical: "/collections/artifacts",
	},
	openGraph: {
		title: "Artifacts | Stardew Valley Companion",
		description: "Track your Stardew Valley artifacts collection.",
		url: "/collections/artifacts",
	},
};

const ArtifactsLayout = ({ children }: { children: React.ReactNode }) => children;

export default ArtifactsLayout;
