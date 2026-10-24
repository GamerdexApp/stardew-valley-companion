import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { AppShell } from "@/comps/shell/AppShell";
import { ToastProvider } from "@/comps/ui/Toast";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn() }),
	usePathname: () => "/overview",
	useSearchParams: () => new URLSearchParams(""),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

beforeEach(async () => {
	localStorage.clear();
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
	await act(async () => {
		root.render(
			<UIProvider>
				<ToastProvider>
					<PlaythroughProvider>
						<AppShell>
							<h1>Page</h1>
						</AppShell>
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
});

describe("The app shell", () => {
	it("has a skip link that lands on a main area that can take focus", () => {
		const skip = container.querySelector<HTMLAnchorElement>("a[href='#main']")!;
		const main = container.querySelector("main")!;

		expect(skip.textContent).toBe("Skip to content");
		expect(main.id).toBe("main");
		expect(main.getAttribute("tabindex")).toBe("-1");
	});

	it("names the menu drawer", () => {
		const drawer = container.querySelector("dialog")!;

		expect(drawer.getAttribute("aria-label")).toBe("Site menu");
	});

	it("gives the sidebar its own focus ring color, so a link stays visible on the navy background", () => {
		const sidebar = container.querySelector("aside > div")!;
		const css = readFileSync(
			path.resolve(import.meta.dirname, "../../src/app/globals.css"),
			"utf8"
		);

		expect(sidebar.className).toContain("[--ring:var(--color-sb-ring)]");
		expect(css.match(/--sb-ring:/g)).toHaveLength(2);
		expect(css).toContain("[data-focus-inset] :focus-visible");
	});
});
