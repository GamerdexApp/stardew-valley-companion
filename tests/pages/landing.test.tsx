import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { redirectReturningVisitor } from "@/lib/landingRedirect";
import { STORAGE_KEY } from "@/service/storage";
import { LandingPage } from "@/comps/landing/LandingPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/",
	useSearchParams: () => new URLSearchParams(navigation.search),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

const seed = (data: AppData) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as AppData;
const data = () => stored().playthroughs[0].data;

const withData = (change: (data: AppData["playthroughs"][number]["data"]) => void): AppData => {
	const playthrough = emptyPlaythrough();
	change(playthrough.data);
	return { playthroughs: [playthrough], activePlaythroughId: playthrough.id };
};

const mount = async () => {
	await act(async () => {
		root.render(
			<UIProvider>
				<ToastProvider>
					<PlaythroughProvider>
						<LandingPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const text = () => container.textContent ?? "";
const click = async (element: Element | null | undefined) => {
	expect(element).toBeTruthy();
	await act(async () => {
		element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
};
const link = (label: string) =>
	[...container.querySelectorAll("a")].filter((a) => a.textContent?.trim() === label);
const question = (label: string) =>
	[...container.querySelectorAll("#faq button")].find((b) =>
		b.textContent?.includes(label)
	) as HTMLElement;

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	navigation.search = "";
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
});

describe("Landing page for a new visitor", () => {
	it("shows the title, the copy and the calls to start", async () => {
		await mount();

		expect(container.querySelector("h1")?.textContent).toBe("Track every detail of your farm");
		expect(text()).toContain(
			"Free and private. Your data stays in your browser unless you turn on sync."
		);
		expect(link("Get started").length).toBeGreaterThanOrEqual(2);
		expect(link("Get started")[0].getAttribute("href")).toBe("/playthroughs/new");
		expect(link("Learn more")[0].getAttribute("href")).toBe("#features");
		expect(link("Go to dashboard")).toHaveLength(0);
	});

	it("lists the nine features, the save import note and the three steps", async () => {
		await mount();
		const features = container.querySelector("#features")!;

		expect(features.querySelectorAll("ul > li")).toHaveLength(9);
		expect(features.textContent).toContain("Community Center");
		expect(features.textContent).toContain("Perfection tracker");
		expect(features.textContent).toContain("Save file import gives you the full experience");
		expect(container.querySelectorAll("ol > li")).toHaveLength(3);
		expect(text()).toContain("Get started in minutes");
	});

	it("has a header with anchor links, GitHub and Discord that open in a new tab", async () => {
		await mount();
		const header = container.querySelector("header")!;

		expect(header.querySelector('a[href="#features"]')).not.toBeNull();
		expect(header.querySelector('a[href="#faq"]')).not.toBeNull();
		for (const name of ["GitHub", "Discord"]) {
			const external = [...header.querySelectorAll("a")].find((a) => a.textContent === name)!;
			expect(external.getAttribute("target")).toBe("_blank");
			expect(external.getAttribute("rel")).toContain("noopener");
		}
	});

	it("links the logo to the landing page without the redirect", async () => {
		await mount();

		expect(container.querySelector('header a[href="/?home"]')).not.toBeNull();
	});

	it("has the footer with the disclaimer", async () => {
		await mount();

		expect(container.querySelector("footer")!.textContent).toContain("not affiliated with");
	});
});

describe("Landing page for a returning visitor", () => {
	it("shows the way to the dashboard and the playthroughs", async () => {
		seed(withData(() => {}));
		await mount();

		expect(link("Go to dashboard").length).toBeGreaterThanOrEqual(2);
		expect(link("Go to dashboard")[0].getAttribute("href")).toBe("/overview");
		expect(link("Playthroughs")[0].getAttribute("href")).toBe("/playthroughs");
		expect(link("Get started")).toHaveLength(0);
		expect(link("Learn more")).toHaveLength(0);
	});
});

describe("Frequently asked questions", () => {
	it("opens the first answer and only one at a time", async () => {
		await mount();

		expect(question("What is Stardew Valley Companion?").getAttribute("aria-expanded")).toBe(
			"true"
		);
		expect(question("How does it store my data?").getAttribute("aria-expanded")).toBe("false");
		await click(question("How does it store my data?"));
		expect(question("What is Stardew Valley Companion?").getAttribute("aria-expanded")).toBe(
			"false"
		);
		expect(question("How does it store my data?").getAttribute("aria-expanded")).toBe("true");
		const answer = container.querySelector(
			`#${CSS.escape(question("How does it store my data?").getAttribute("aria-controls")!)}`
		) as HTMLElement;
		expect(answer.hidden).toBe(false);
		expect(answer.textContent).toContain("stored locally in your browser");
	});

	it("closes an open answer when its question is pressed again", async () => {
		await mount();

		await click(question("What is Stardew Valley Companion?"));

		expect(question("What is Stardew Valley Companion?").getAttribute("aria-expanded")).toBe(
			"false"
		);
	});

	it("has five questions", async () => {
		await mount();

		expect(container.querySelectorAll("#faq h3")).toHaveLength(5);
	});
});

describe("Redirect for a returning visitor", () => {
	const run = (search: string, stored: unknown, pathname = "/") => {
		const replace = vi.fn();
		const storage = { getItem: () => (stored === undefined ? null : JSON.stringify(stored)) };
		new Function("location", "localStorage", redirectReturningVisitor)(
			{ pathname, search, replace },
			storage
		);
		return replace;
	};

	it("goes to the dashboard when a playthrough is saved", () => {
		expect(run("", { playthroughs: [{ id: "a" }] })).toHaveBeenCalledWith("/overview");
	});

	it("stays when there are no playthroughs or no saved data", () => {
		expect(run("", { playthroughs: [] })).not.toHaveBeenCalled();
		expect(run("", undefined)).not.toHaveBeenCalled();
	});

	it("stays on the address with home in it", () => {
		expect(run("?home", { playthroughs: [{ id: "a" }] })).not.toHaveBeenCalled();
	});

	it("does nothing when the saved data cannot be read", () => {
		const replace = vi.fn();
		new Function("location", "localStorage", redirectReturningVisitor)(
			{ pathname: "/", search: "", replace },
			{ getItem: () => "{broken" }
		);

		expect(replace).not.toHaveBeenCalled();
	});

	it("acts on the landing address only", () => {
		expect(run("", { playthroughs: [{ id: "a" }] }, "/farm")).not.toHaveBeenCalled();
		expect(run("", { playthroughs: [{ id: "a" }] }, "/overview")).not.toHaveBeenCalled();
	});

	it("runs from the head of the root layout, never from the page", async () => {
		await mount();
		const layout = readFileSync(
			path.resolve(import.meta.dirname, "../../src/app/layout.tsx"),
			"utf8"
		);
		const head = layout.slice(layout.indexOf("<head>"), layout.indexOf("</head>"));

		expect(container.querySelector("script")).toBeNull();
		expect(head).toContain("redirectReturningVisitor");
	});
});
