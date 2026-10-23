import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { STORAGE_KEY } from "@/service/storage";
import { AboutTab } from "@/comps/settings/AboutTab";
import { DataTab } from "@/comps/settings/DataTab";
import { PreferencesTab } from "@/comps/settings/PreferencesTab";
import { SettingsPage } from "@/comps/settings/SettingsPage";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough, progressedPlaythrough } from "../storage/fixtures";

const navigation = vi.hoisted(() => ({
	search: "",
	replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: navigation.replace }),
	usePathname: () => "/settings",
	useSearchParams: () => new URLSearchParams(navigation.search),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

const seed = (data: AppData) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as AppData | null;

const mount = async (page: ReactNode) => {
	await act(async () => {
		root.render(
			<UIProvider>
				<ToastProvider>
					<PlaythroughProvider>{page}</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const buttons = () => [...document.body.querySelectorAll("button")];
const button = (label: string) =>
	buttons().find((b) => b.textContent?.includes(label)) as HTMLButtonElement | undefined;

const click = async (element: Element | undefined | null) => {
	expect(element).toBeTruthy();
	await act(async () => {
		element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
};

const radio = (label: string) =>
	[...document.body.querySelectorAll('input[type="radio"]')].find((input) =>
		input.closest("label")?.textContent?.includes(label)
	);

const first = progressedPlaythrough();
const second = { ...emptyPlaythrough(), platform: undefined };
const saved: AppData = {
	playthroughs: [first, second],
	activePlaythroughId: first.id,
};

beforeEach(() => {
	localStorage.clear();
	navigation.search = "";
	navigation.replace.mockReset();
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	document.body.querySelectorAll("dialog").forEach((dialog) => dialog.remove());
	vi.restoreAllMocks();
});

describe("Settings page", () => {
	it("opens on Preferences and lists the tabs", async () => {
		seed(saved);
		await mount(<SettingsPage />);

		const tabs = [...container.querySelectorAll('[role="tab"]')].map((tab) =>
			tab.textContent?.trim()
		);

		expect(tabs).toEqual(["Preferences", "Backup and data", "About"]);
		expect(container.textContent).toContain("Playthrough settings");
	});

	it("opens the tab named in the address", async () => {
		navigation.search = "tab=about";
		await mount(<SettingsPage />);

		expect(container.textContent).toContain("Version");
		expect(container.textContent).not.toContain("Playthrough settings");
	});

	it("falls back to Preferences for an unknown tab", async () => {
		navigation.search = "tab=nothing";
		await mount(<SettingsPage />);

		expect(container.textContent).toContain("Playthrough settings");
	});

	it("writes the chosen tab into the address", async () => {
		await mount(<SettingsPage />);
		const dataTab = [...container.querySelectorAll('[role="tab"]')].find((tab) =>
			tab.textContent?.includes("Backup and data")
		);

		await click(dataTab);

		expect(navigation.replace).toHaveBeenCalledWith("/settings?tab=data", {
			scroll: false,
		});
	});
});

describe("Preferences tab", () => {
	it("shows one platform row per playthrough, with Not set only while unset", async () => {
		seed(saved);
		await mount(<PreferencesTab />);

		const [withPlatform, withoutPlatform] = [...container.querySelectorAll("select")];

		expect(container.textContent).toContain("Riverland");
		expect(container.textContent).toContain("Fresh farm");
		expect(withPlatform.textContent).not.toContain("Not set");
		expect(withoutPlatform.textContent).toContain("Not set");
	});

	it("changes the platform, keeps lastModified and offers Undo", async () => {
		seed(saved);
		await mount(<PreferencesTab />);
		const select = container.querySelectorAll("select")[0];

		await act(async () => {
			select.value = "Xbox";
			select.dispatchEvent(new Event("change", { bubbles: true }));
		});

		const after = stored()!.playthroughs[0];
		expect(after.platform).toBe("Xbox");
		expect(after.lastModified).toBe(first.lastModified);
		expect(document.body.textContent).toContain("Riverland is now Xbox.");

		await click(button("Undo"));
		expect(stored()!.playthroughs[0].platform).toBe("PC");
	});

	it("saves the theme into the settings of the saved data", async () => {
		seed(saved);
		await mount(<PreferencesTab />);

		await click(radio("Dark"));

		expect(stored()!.settings).toEqual({ theme: "dark" });
	});

	it("points to creating a playthrough when there are none", async () => {
		await mount(<PreferencesTab />);

		expect(container.textContent).toContain("No playthroughs yet.");
		expect(container.querySelector("select")).toBeNull();
	});
});

describe("Backup and data tab", () => {
	const chooseFile = async (content: string, name = "backup.json") => {
		const input = container.querySelector('input[type="file"]') as HTMLInputElement;
		const file = new File([content], name, { type: "application/json" });
		Object.defineProperty(input, "files", { value: [file], configurable: true });
		await act(async () => {
			input.dispatchEvent(new Event("change", { bubbles: true }));
		});
	};

	const incoming: AppData = {
		playthroughs: [{ ...emptyPlaythrough(), id: "new-one", name: "From file" }],
		activePlaythroughId: "new-one",
	};

	it("shows the count and the file name of an export", async () => {
		seed(saved);
		await mount(<DataTab />);

		expect(container.textContent).toContain("2 playthroughs");
		expect(container.textContent).toMatch(/stardew-companion-backup-\d{4}-\d{2}-\d{2}\.json/);
	});

	it("downloads a backup and says so", async () => {
		seed(saved);
		URL.createObjectURL = vi.fn(() => "blob:test");
		URL.revokeObjectURL = vi.fn();
		await mount(<DataTab />);

		await click(button("Export all playthroughs"));

		expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
		expect(document.body.textContent).toContain("Backup downloaded");
	});

	it("keeps Review import off until a file is chosen", async () => {
		await mount(<DataTab />);

		expect(button("Review import")!.disabled).toBe(true);

		await chooseFile("{}");

		expect(button("Review import")!.disabled).toBe(false);
		expect(container.textContent).toContain("backup.json");
	});

	it("explains a file that is not a backup and changes nothing", async () => {
		seed(saved);
		await mount(<DataTab />);

		await chooseFile("not json");
		await click(button("Review import"));

		expect(document.body.textContent).toContain("Import failed.");
		expect(document.body.textContent).toContain("The file is not valid JSON.");
		expect(button("Merge")).toBeUndefined();
		expect(stored()).toEqual(saved);
	});

	it("previews a good file and merges by default, keeping the active playthrough", async () => {
		seed(saved);
		await mount(<DataTab />);

		await chooseFile(JSON.stringify(incoming));
		await click(button("Review import"));

		expect(document.body.textContent).toContain("Checks on the file.");
		expect(document.body.textContent).toContain("1 added, 2 kept");
		expect(stored()).toEqual(saved);

		await click(button("Merge"));

		const result = stored()!;
		expect(result.playthroughs.map((p) => p.name)).toEqual([
			"Riverland",
			"Fresh farm",
			"From file",
		]);
		expect(result.activePlaythroughId).toBe(first.id);
		expect(document.body.textContent).toContain("Backup merged");
	});

	it("undoes a merge", async () => {
		seed(saved);
		await mount(<DataTab />);

		await chooseFile(JSON.stringify(incoming));
		await click(button("Review import"));
		await click(button("Merge"));
		await click(button("Undo"));

		expect(stored()).toEqual(saved);
	});

	it("replaces everything when Replace is chosen", async () => {
		seed(saved);
		await mount(<DataTab />);

		await chooseFile(JSON.stringify(incoming));
		await click(button("Review import"));
		await click(radio("Replace everything"));
		await click(button("Replace"));

		expect(stored()!.playthroughs.map((p) => p.name)).toEqual(["From file"]);
		expect(stored()!.activePlaythroughId).toBe("new-one");
		expect(document.body.textContent).toContain("Backup replaced");
	});

	describe("reset", () => {
		it("is off when there is nothing to reset", async () => {
			await mount(<DataTab />);

			expect(button("Reset all data")!.disabled).toBe(true);
		});

		it("asks first, lists what is removed, and keeps the data on Cancel", async () => {
			seed(saved);
			await mount(<DataTab />);

			await click(button("Reset all data"));

			expect(document.body.textContent).toContain(
				"Delete all 2 playthroughs from this browser?"
			);
			expect(document.body.textContent).toContain("Riverland");
			expect(stored()).toEqual(saved);

			await click(button("Cancel"));
			expect(stored()).toEqual(saved);
		});

		it("clears everything including the theme, and offers Undo", async () => {
			seed({ ...saved, settings: { theme: "dark" } });
			await mount(<DataTab />);

			await click(button("Reset all data"));
			await click(button("Yes, reset all data"));

			expect(stored()).toEqual({ playthroughs: [], activePlaythroughId: null });
			expect(document.body.textContent).toContain("All data reset");
			expect(document.body.textContent).toContain("2 playthroughs removed");

			await click(button("Undo"));
			expect(stored()!.playthroughs).toHaveLength(2);
			expect(stored()!.settings).toEqual({ theme: "dark" });
		});
	});
});

describe("About tab", () => {
	it("shows the app name, the wiki link and the disclaimer", async () => {
		await mount(<AboutTab />);

		expect(container.textContent).toContain("Stardew Valley Companion");
		expect(container.querySelector('a[href="https://stardewvalleywiki.com"]')).not.toBeNull();
		expect(container.textContent).toContain("Not affiliated with");
	});
});
