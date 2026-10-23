import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { forgetMemoryState } from "@/lib/hooks/useMemoryState";
import { STORAGE_KEY } from "@/service/storage";
import { CollectionsPage } from "@/comps/collections/CollectionsPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({ search: "", replace: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/collections",
	useSearchParams: () => new URLSearchParams(navigation.search),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

const seed = (data: AppData) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as AppData;

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
						<CollectionsPage />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const text = () => container.textContent ?? "";
const cardCount = () => container.querySelectorAll('button[aria-label$=", show locations"]').length;
const cardOf = (name: string) =>
	container
		.querySelector(`button[aria-label="${name}, show locations"]`)!
		.closest("div.flex.flex-col.gap-2\\.5") as HTMLElement;
const statusRadio = (root: ParentNode, name: string, status: string) =>
	[...root.querySelectorAll("fieldset")]
		.find((f) => f.querySelector("legend")?.textContent === `${name} status`)
		?.querySelector(`input[value="${status}"]`) as HTMLInputElement;
const saved = (id: string) => stored().playthroughs[0].data.artifacts[id];

const click = async (element: Element | null | undefined) => {
	expect(element).toBeTruthy();
	await act(async () => {
		element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
};

const type = async (input: HTMLInputElement, value: string) => {
	await act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
			input,
			value
		);
		input.dispatchEvent(new Event("input", { bubbles: true }));
	});
};

const flyout = () =>
	[...document.body.querySelectorAll("dialog")].find((el) =>
		el.textContent?.includes("Changes apply as you go")
	);

const openFilters = async () => {
	await click(
		[...container.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Filters"))
	);
};

const flyoutRadio = (label: string) =>
	[...flyout()!.querySelectorAll('input[type="radio"]')].find(
		(input) => input.closest("label")?.textContent?.trim() === label
	);

beforeEach(() => {
	forgetMemoryState();
	localStorage.clear();
	navigation.search = "tab=artifacts";
	navigation.replace.mockReset();
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	document.body.querySelectorAll("dialog").forEach((dialog) => dialog.remove());
});

const toastButton = (label: string) =>
	[...document.body.querySelectorAll("button")].find((b) => b.textContent === label);

describe("Collections artifacts tab", () => {
	it("shows the four tiles and all 42 artifacts", async () => {
		seed(withData(() => {}));
		await mount();

		expect(text()).toContain("With rewards");
		expect(text()).toContain("15");
		expect(cardCount()).toBe(42);
		expect(text()).toContain("Showing 42 of 42 artifacts");
	});

	it("shows the found count on the tab pill and found and donated in the subline", async () => {
		seed(
			withData((data) => {
				data.artifacts["96"] = { found: true, donated: true };
				data.artifacts["97"] = { found: true, donated: false };
			})
		);
		await mount();

		const selected = container.querySelector('[role="tab"][aria-selected="true"]');
		expect(selected?.textContent).toBe("Artifacts2 / 42");
		expect(text()).toContain("2 of 42 found · 1 donated");
	});

	it("marks a missing artifact Missing on its card", async () => {
		seed(withData(() => {}));
		await mount();

		expect(statusRadio(cardOf("Dwarf Scroll I"), "Dwarf Scroll I", "missing").checked).toBe(
			true
		);
	});

	it("saves Found as found without donated and shows no toast", async () => {
		seed(withData(() => {}));
		await mount();

		await click(statusRadio(container, "Dwarf Scroll I", "found"));

		expect(saved("96")).toEqual({ found: true, donated: false });
		expect(document.body.textContent).not.toContain("also marked");
	});

	it("saves Donated as both and says Found was set too, with Undo", async () => {
		seed(withData(() => {}));
		await mount();

		await click(statusRadio(container, "Dwarf Scroll II", "donated"));

		expect(saved("97")).toEqual({ found: true, donated: true });
		expect(document.body.textContent).toContain(
			"Dwarf Scroll II set to Donated. It was also marked Found."
		);

		await click(toastButton("Undo"));
		expect(saved("97")).toBeUndefined();
	});

	it("says both were cleared when Missing follows Donated, and Undo restores them", async () => {
		seed(
			withData((data) => {
				data.artifacts["97"] = { found: true, donated: true };
			})
		);
		await mount();

		await click(statusRadio(container, "Dwarf Scroll II", "missing"));

		expect(saved("97")).toBeUndefined();
		expect(document.body.textContent).toContain(
			"Dwarf Scroll II set to Missing. Found and Donated were cleared."
		);

		await click(toastButton("Undo"));
		expect(saved("97")).toEqual({ found: true, donated: true });
	});

	it("keeps Found when Donated goes back to Found", async () => {
		seed(
			withData((data) => {
				data.artifacts["97"] = { found: true, donated: true };
			})
		);
		await mount();

		await click(statusRadio(container, "Dwarf Scroll II", "found"));

		expect(saved("97")).toEqual({ found: true, donated: false });
		expect(document.body.textContent).not.toContain("were cleared");
	});

	it("searches by name", async () => {
		seed(withData(() => {}));
		await mount();

		await type(container.querySelector('input[type="search"]') as HTMLInputElement, "dwarf");

		expect(cardCount()).toBe(5);
	});

	it("filters by donation, found and reward in the flyout", async () => {
		seed(
			withData((data) => {
				data.artifacts["96"] = { found: true, donated: true };
				data.artifacts["97"] = { found: true, donated: false };
			})
		);
		await mount();
		await openFilters();

		await click(flyoutRadio("Donated"));
		expect(cardCount()).toBe(1);
		await click(
			[...flyout()!.querySelectorAll("button")].find((b) => b.textContent === "Reset")
		);
		await click(flyoutRadio("Not found"));
		expect(cardCount()).toBe(40);
		await click(
			[...flyout()!.querySelectorAll("button")].find((b) => b.textContent === "Reset")
		);
		await click(flyoutRadio("Has reward"));
		expect(cardCount()).toBe(15);
		expect(flyout()!.textContent).toContain("Show 15 artifacts");
	});

	it("gives a reward chip to the artifacts that have a donation reward only", async () => {
		seed(withData(() => {}));
		await mount();

		expect(cardOf("Dwarf Scroll I").textContent).toContain("Reward");
		expect(cardOf("Chipped Amphora").textContent).not.toContain("Reward");
		expect(cardOf("Dwarf Scroll I").textContent).toContain("Locations and reward");
		expect(cardOf("Chipped Amphora").textContent).toContain("Locations");
		expect(cardOf("Chipped Amphora").textContent).not.toContain("and reward");
	});

	it("opens a dialog with the status control, locations and reward, and edits from it", async () => {
		seed(withData(() => {}));
		await mount();

		await click(container.querySelector('button[aria-label="Dwarf Scroll I, show locations"]'));
		const dialog = [...document.body.querySelectorAll("dialog")].find((d) =>
			d.textContent?.includes("How to find")
		)!;

		expect(dialog.textContent).toContain("Donated always includes Found");
		expect(dialog.textContent).toContain("Tilling in Mines/Skull Cavern (any floor)");
		expect(dialog.textContent).toContain("Museum reward");
		await click(statusRadio(dialog, "Dwarf Scroll I", "donated"));
		expect(saved("96")).toEqual({ found: true, donated: true });
	});

	it("shows a no match state with a clear button", async () => {
		seed(withData(() => {}));
		await mount();

		await type(container.querySelector('input[type="search"]') as HTMLInputElement, "zzzz");

		expect(text()).toContain("No artifacts match your filters.");
		await click(
			[...container.querySelectorAll("button")].find((b) => b.textContent === "Clear filters")
		);
		expect(cardCount()).toBe(42);
	});

	it("remembers the filters while the app stays open", async () => {
		seed(withData(() => {}));
		await mount();
		await type(container.querySelector('input[type="search"]') as HTMLInputElement, "dwarf");
		act(() => root.unmount());
		root = createRoot(container);
		await mount();

		expect(cardCount()).toBe(5);
	});
});
