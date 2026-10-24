import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { Footer } from "@/comps/shell/Footer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

beforeEach(async () => {
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
	await act(async () => root.render(<Footer />));
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
});

const links = (name: string) =>
	[...container.querySelectorAll(`nav[aria-label="${name}"] a`)].map((link) => ({
		text: link.textContent,
		href: link.getAttribute("href"),
		newTab: link.getAttribute("target") === "_blank",
	}));

describe("The footer", () => {
	it("lists Settings, Discord, GitHub, the privacy policy and the terms under Support", () => {
		expect(links("Support")).toEqual([
			{ text: "Settings", href: "/settings", newTab: false },
			{ text: "Discord", href: "https://discord.gg/3qe4dS6pmT", newTab: true },
			{
				text: "GitHub",
				href: "https://github.com/GamerdexApp/stardew-valley-companion",
				newTab: true,
			},
			{ text: "Privacy policy", href: "https://gamerdex.app/privacy", newTab: false },
			{ text: "Terms of service", href: "https://gamerdex.app/terms", newTab: false },
		]);
	});

	it("lists the wiki under About, and the disclaimer after it", () => {
		expect(links("About")).toEqual([
			{ text: "Stardew Valley Wiki", href: "https://stardewvalleywiki.com", newTab: true },
		]);
		expect(container.textContent).toContain(
			"not affiliated with, endorsed by, or connected to"
		);
	});

	it("says where the data lives, including sync", () => {
		expect(container.textContent).toContain(
			"Your data stays in your browser, or in your own cloud storage if you turn on sync."
		);
		expect(container.textContent).toContain("Built with the Gamerdex framework");
	});
});
