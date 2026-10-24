import SyncCallbackPage from "@/app/(app)/sync/callback/page";
import { type Conflict, ProviderError, type SyncState } from "@gamerdexapp/gamerdex-sync";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { SyncProvider } from "@/lib/contexts/SyncContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { deviceStore } from "@/lib/sync/device";
import { STORAGE_KEY, storageService } from "@/service/storage";
import { SettingsPage } from "@/comps/settings/SettingsPage";
import { SyncChip } from "@/comps/shell/SyncChip";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough, progressedPlaythrough } from "../storage/fixtures";

const mocks = vi.hoisted(() => ({
	search: "tab=sync",
	replace: vi.fn(),
	runSync: vi.fn(),
	signIn: vi.fn(),
	getToken: vi.fn(async () => "token"),
	listRepositories: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: mocks.replace }),
	usePathname: () => "/settings",
	useSearchParams: () => new URLSearchParams(mocks.search),
}));

vi.mock("@/lib/sync/run", () => ({
	runSync: mocks.runSync,
	tokenSource: () => ({
		signIn: mocks.signIn,
		getToken: mocks.getToken,
		signOut: vi.fn(),
		isSignedIn: () => true,
	}),
}));

vi.mock("@gamerdexapp/gamerdex-sync", async (original) => ({
	...(await original<typeof import("@gamerdexapp/gamerdex-sync")>()),
	listInstalledRepositories: mocks.listRepositories,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

const first = progressedPlaythrough();
const second = emptyPlaythrough();
const saved: AppData = {
	playthroughs: [first, second],
	activePlaythroughId: first.id,
};

const tokens = {
	accessToken: "a",
	refreshToken: "r",
	accessExpiresAt: Date.now() + 3_600_000,
	refreshExpiresAt: Date.now() + 86_400_000,
};

const syncState = (playthroughs = saved.playthroughs): SyncState => ({
	base: { playthroughs },
	dataVersion: "1",
	metaVersion: "1",
});

const connect = (provider: "google" | "github" = "google", extra = {}) =>
	deviceStore.update({
		provider,
		tokens,
		state: syncState(),
		lastSyncAt: "2026-02-03T10:00:00.000Z",
		...(provider === "github" && { repository: "me/gamerdex-data" }),
		...extra,
	});

const synced = (overrides = {}) => ({
	status: "synced" as const,
	data: structuredClone(saved),
	state: syncState(),
	conflicts: [] as Conflict[],
	uploaded: false,
	...overrides,
});

const wait = async (ms = 0) =>
	act(async () => {
		await new Promise((resolve) => setTimeout(resolve, ms));
	});

const mount = async (page: ReactNode = <SettingsPage />) => {
	await act(async () => {
		root.render(
			<UIProvider>
				<ToastProvider>
					<PlaythroughProvider>
						<SyncProvider>{page}</SyncProvider>
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
	await wait(40);
	await wait(40);
};

const text = () => container.textContent ?? "";
const buttons = () => [...document.body.querySelectorAll("button")];
const button = (label: string) =>
	buttons().find((b) => b.textContent?.includes(label)) as HTMLButtonElement | undefined;
const click = async (element: Element | undefined | null) => {
	expect(element).toBeTruthy();
	await act(async () => {
		element!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	});
};
const location = vi.hoisted(() => ({ href: "", origin: "https://tracker.test", search: "" }));

beforeEach(() => {
	localStorage.clear();
	mocks.search = "tab=sync";
	mocks.replace.mockReset();
	mocks.runSync.mockReset();
	mocks.signIn.mockReset();
	mocks.listRepositories.mockReset();
	location.href = "";
	location.search = "";
	vi.stubGlobal("location", location);
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	document.body.querySelectorAll("dialog").forEach((dialog) => dialog.remove());
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe("Cloud sync, signed out", () => {
	it("offers the four providers and starts on Google Drive", async () => {
		await mount();
		const tiles = [...container.querySelectorAll('[role="radio"]')];

		expect(tiles.map((tile) => tile.querySelector("span span")?.textContent)).toEqual([
			"Google Drive",
			"Dropbox",
			"OneDrive",
			"GitHub",
		]);
		expect(tiles[0].getAttribute("aria-checked")).toBe("true");
		expect(text()).toContain("Not connected");
		expect(text()).toContain("Connect Google Drive");
		expect(text()).toContain("How sync works");
	});

	it("shows the steps of the provider that is picked", async () => {
		await mount();

		await click([...container.querySelectorAll('[role="radio"]')][3]);

		expect(text()).toContain("Connect GitHub");
		expect(text()).toContain("Create an empty private repository named gamerdex-data");
		expect(button("Connect GitHub")).toBeTruthy();
		expect(button("Connect Google Drive")).toBeUndefined();
	});

	it("saves the provider and a check value, then goes to the sign in address", async () => {
		await mount();
		await click([...container.querySelectorAll('[role="radio"]')][1]);

		await click(button("Connect Dropbox"));
		await wait(40);

		const device = deviceStore.load();
		expect(device.provider).toBe("dropbox");
		expect(device.signInState).toBeTruthy();
		const url = new URL(location.href);
		expect(url.hostname).toBe("www.dropbox.com");
		expect(url.searchParams.get("state")).toBe(device.signInState);
		expect(url.searchParams.get("redirect_uri")).toBe("https://tracker.test/sync/callback");
	});

	it("shows no sync chip", async () => {
		await mount(<SyncChip />);

		expect(text()).toBe("");
	});
});

describe("Cloud sync, connected", () => {
	beforeEach(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
		connect();
		mocks.runSync.mockResolvedValue(synced());
	});

	it("syncs when it opens and shows the state, the storage and the playthroughs", async () => {
		await mount();

		expect(mocks.runSync).toHaveBeenCalled();
		expect(text()).toContain("Google Drive");
		expect(text()).toContain("Synced");
		expect(text()).toContain("Folder Gamerdex");
		expect(text()).toContain("Gamerdex/stardew-valley-companion");
		expect(text()).toContain("data.json");
		expect(text()).toContain("Riverland");
		expect(text()).toContain("Fresh farm");
		expect(text()).toContain("Fall 12, Year 2");
	});

	it("keeps the state of the sync and the time for the next sync", async () => {
		const state = { ...syncState(), dataVersion: "7" };
		mocks.runSync.mockResolvedValue(synced({ state }));
		deviceStore.update({ lastSyncAt: null });
		await mount();

		expect(deviceStore.load().state).toEqual(state);
		expect(deviceStore.load().lastSyncAt).not.toBeNull();
	});

	it("does not sync again after it applied a download", async () => {
		const merged = structuredClone(saved);
		merged.playthroughs[0].name = "From the cloud";
		mocks.runSync.mockResolvedValue(synced({ data: merged }));
		vi.useFakeTimers({ shouldAdvanceTime: true });
		await mount();
		mocks.runSync.mockClear();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(10_000);
		});

		expect(mocks.runSync).not.toHaveBeenCalled();
	});

	it("says a playthrough is new here, changed here or synced", async () => {
		const changed = structuredClone(first);
		changed.name = "Edited";
		deviceStore.update({ state: syncState([changed]) });
		mocks.runSync.mockResolvedValue(synced({ state: syncState([changed]) }));
		await mount();
		const rows = [...container.querySelectorAll("li")].filter((li) => li.querySelector("dl"));

		expect(rows[0].textContent).toContain("Changed here");
		expect(rows[1].textContent).toContain("New here");
		expect(rows[1].textContent).toContain("Not in the cloud yet");
	});

	it("shows a sync chip that says Synced and links to the tab", async () => {
		await mount(<SyncChip />);

		const link = container.querySelector("a")!;
		expect(link.textContent).toBe("Synced");
		expect(link.getAttribute("href")).toBe("/settings?tab=sync");
	});

	it("syncs again from the Sync now button", async () => {
		await mount();
		mocks.runSync.mockClear();

		await click(button("Sync now"));

		expect(mocks.runSync).toHaveBeenCalledTimes(1);
	});

	it("applies what the cloud sent to the saved data and records it", async () => {
		const merged = structuredClone(saved);
		merged.playthroughs[0].name = "From the cloud";
		mocks.runSync.mockResolvedValue(synced({ data: merged, uploaded: false }));
		await mount();

		expect(storageService.load().playthroughs[0].name).toBe("From the cloud");
		expect(deviceStore.load().activity[0].kind).toBe("downloaded");
		expect(text()).toContain("Downloaded changes from the cloud.");
	});

	it("records an upload when only the cloud changed", async () => {
		mocks.runSync.mockResolvedValue(synced({ uploaded: true }));
		await mount();

		expect(deviceStore.load().activity[0].kind).toBe("uploaded");
	});

	it("keeps the choice of the device when it applies a result", async () => {
		const merged = structuredClone(saved);
		merged.playthroughs[0].name = "Changed";
		merged.activePlaythroughId = second.id;
		mocks.runSync.mockResolvedValue(synced({ data: merged }));
		await mount();

		expect(storageService.load().activePlaythroughId).toBe(first.id);
	});

	it("syncs a few seconds after a change", async () => {
		await mount();
		vi.useFakeTimers();
		mocks.runSync.mockClear();

		await act(async () => {
			const changed = structuredClone(saved);
			changed.playthroughs[0].name = "Typed";
			storageService.save(changed);
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3000);
		});
		expect(mocks.runSync).not.toHaveBeenCalled();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});

		expect(mocks.runSync).toHaveBeenCalledTimes(1);
	});

	it("does not sync by itself when automatic sync is off, and Sync now still works", async () => {
		deviceStore.update({ autoSync: false });
		await mount();
		vi.useFakeTimers();
		await act(async () => {
			storageService.save({ ...saved, playthroughs: [{ ...first, name: "Typed" }, second] });
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(10_000);
		});
		expect(mocks.runSync).not.toHaveBeenCalled();

		await click(button("Sync now"));

		expect(mocks.runSync).toHaveBeenCalledTimes(1);
	});

	it("turns the three sync settings on and off", async () => {
		await mount();
		const switches = [...container.querySelectorAll('[role="switch"]')];

		expect(switches.map((item) => item.getAttribute("aria-checked"))).toEqual([
			"true",
			"true",
			"false",
		]);
		await click(switches[0]);
		await click(switches[2]);

		expect(deviceStore.load()).toMatchObject({ autoSync: false, waitOnMetered: true });
	});

	it("renames the device when the field loses focus, and ignores an empty name", async () => {
		await mount();
		const input = container.querySelector<HTMLInputElement>('input[maxlength="60"]')!;
		const setValue = (value: string) =>
			act(async () => {
				const setter = Object.getOwnPropertyDescriptor(
					HTMLInputElement.prototype,
					"value"
				)!.set!;
				setter.call(input, value);
				input.dispatchEvent(new Event("input", { bubbles: true }));
			});
		const blur = () =>
			act(async () => {
				input.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
			});

		await setValue("Kitchen laptop");
		await blur();
		expect(deviceStore.load().deviceName).toBe("Kitchen laptop");

		await setValue("   ");
		await blur();
		expect(deviceStore.load().deviceName).toBe("Kitchen laptop");
	});

	it("disconnects and goes back to the provider choice, and keeps the playthroughs", async () => {
		await mount();

		await click(button("Disconnect Google Drive"));

		expect(deviceStore.load()).toMatchObject({ provider: null, tokens: null, state: null });
		expect(text()).toContain("Connect Google Drive");
		expect(storageService.load().playthroughs).toHaveLength(2);
	});
});

describe("Cloud sync, problems", () => {
	beforeEach(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
		connect();
	});

	it("asks to sign in again when the provider refuses the token", async () => {
		mocks.runSync.mockRejectedValue(new ProviderError("auth", "Refused.", 401));
		await mount();

		expect(text()).toContain("Your sign in ended. Sign in again to keep syncing.");
		expect(text()).toContain("Sign in again");
		expect(button("Sign in with Google Drive")).toBeTruthy();
		expect(button("Sync now")).toBeUndefined();
	});

	it("says it is offline when the network fails", async () => {
		mocks.runSync.mockRejectedValue(new ProviderError("network", "Offline."));
		await mount(<SyncChip />);

		expect(container.querySelector("a")!.textContent).toBe("Offline");
	});

	it("explains a refused folder with the status code", async () => {
		mocks.runSync.mockRejectedValue(new ProviderError("auth", "No.", 403));
		await mount();

		expect(text()).toContain("Google Drive refused access.");
		expect(text()).toContain("Google Drive answered 403.");
		expect(text()).toContain("Sync failed");
	});

	it("explains a limit, a server failure and bad data", async () => {
		mocks.runSync.mockRejectedValue(new ProviderError("rate-limit", "Slow.", 429));
		await mount();
		expect(text()).toContain("is limiting requests");

		mocks.runSync.mockRejectedValue(new ProviderError("server", "Down.", 500));
		await click(button("Sync now"));
		expect(text()).toContain("did not answer correctly");

		mocks.runSync.mockRejectedValue(new Error("Broken."));
		await click(button("Sync now"));
		expect(text()).toContain("Something went wrong. Nothing was changed.");
		expect(deviceStore.load().activity[0].kind).toBe("failed");
	});

	it("lists the changes that could not be merged and lets the player keep the device value", async () => {
		const conflict: Conflict = {
			path: ["playthroughs", first.id, "data", "character", "money"],
			kind: "both-changed",
			base: 100,
			local: 2000,
			remote: 1000,
			taken: "remote",
		};
		const merged = structuredClone(saved);
		merged.playthroughs[0].data.character.money = 1000;
		mocks.runSync.mockResolvedValue(synced({ data: merged, conflicts: [conflict] }));
		await mount();

		expect(text()).toContain("1 change needs a decision");
		expect(text()).toContain("Review changes");
		expect(text()).toContain("Riverland / character / money");
		expect(container.querySelector("#sync-conflicts")!.textContent).toContain("1000");
		expect(container.querySelector("#sync-conflicts")!.textContent).toContain("2000");
		expect(storageService.load().playthroughs[0].data.character.money).toBe(1000);

		await click(button("Use this device's value"));

		expect(storageService.load().playthroughs[0].data.character.money).toBe(2000);
		expect(container.querySelector("#sync-conflicts")).toBeNull();
	});

	it("dismisses the list of changes", async () => {
		const conflict: Conflict = {
			path: ["playthroughs", first.id, "name"],
			kind: "both-changed",
			base: "Old",
			local: "Mine",
			remote: "Theirs",
			taken: "remote",
		};
		mocks.runSync.mockResolvedValue(synced({ conflicts: [conflict] }));
		await mount();

		await click(button("Dismiss"));

		expect(container.querySelector("#sync-conflicts")).toBeNull();
		expect(text()).not.toContain("Review changes");
	});
});

describe("The first sync", () => {
	const remote = { playthroughs: [emptyPlaythrough()], activePlaythroughId: null };

	beforeEach(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
		deviceStore.update({ provider: "google", tokens });
		mocks.runSync.mockResolvedValue({ status: "needs-choice", local: saved, remote });
	});

	it("asks what to keep when both sides have data, and says what each side holds", async () => {
		await mount();
		const dialog = document.body.querySelector("dialog[open]")!;

		expect(dialog.textContent).toContain("This device and the cloud both have data");
		expect(dialog.textContent).toContain("2 playthroughs");
		expect(dialog.textContent).toContain("Riverland, Fresh farm");
		expect(dialog.textContent).toContain("1 playthrough");
		expect(dialog.textContent).toContain("Recommended");
		expect(
			(dialog.querySelector('input[type="radio"]:checked')!.closest("label") as HTMLElement)
				.textContent
		).toContain("Merge both");
	});

	it("syncs again with the choice the player applies", async () => {
		await mount();
		const dialog = document.body.querySelector("dialog[open]")!;
		const keepCloud = [...dialog.querySelectorAll("label")].find((label) =>
			label.textContent?.includes("Keep the cloud")
		)!;
		await click(keepCloud.querySelector("input"));
		mocks.runSync.mockResolvedValue(synced());

		await click(button("Apply choice"));

		expect(mocks.runSync).toHaveBeenLastCalledWith(expect.anything(), "keep-cloud");
		expect(document.body.querySelector("dialog[open]")).toBeNull();
		expect(text()).toContain("Synced");
	});

	it("waits for the player when they decide later, and opens the choice again", async () => {
		await mount();

		await click(button("Decide later"));
		expect(document.body.querySelector("dialog[open]")).toBeNull();
		expect(text()).toContain("The first sync is waiting for your choice.");

		await click(button("Choose"));
		expect(document.body.querySelector("dialog[open]")).not.toBeNull();
	});

	it("takes the cloud copy at once on a device with no playthroughs", async () => {
		localStorage.clear();
		deviceStore.update({ provider: "google", tokens });
		mocks.runSync.mockResolvedValueOnce({
			status: "needs-choice",
			local: { playthroughs: [], activePlaythroughId: null },
			remote,
		});
		mocks.runSync.mockResolvedValue(synced({ data: remote }));
		await mount();

		expect(mocks.runSync).toHaveBeenLastCalledWith(expect.anything(), "keep-cloud");
		expect(document.body.querySelector("dialog[open]")).toBeNull();
		expect(storageService.load().playthroughs).toHaveLength(1);
	});
});

describe("Cloud sync with GitHub", () => {
	beforeEach(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
		deviceStore.update({ provider: "github", tokens });
	});

	const repository = (fullName: string, isPrivate: boolean) => ({
		id: 1,
		fullName,
		private: isPrivate,
	});

	it("takes a private data repository it finds and starts syncing", async () => {
		mocks.listRepositories.mockResolvedValue([repository("me/gamerdex-data", true)]);
		mocks.runSync.mockResolvedValue(synced());
		await mount();
		await wait();

		expect(deviceStore.load().repository).toBe("me/gamerdex-data");
		expect(mocks.runSync).toHaveBeenCalled();
		expect(text()).toContain("me/gamerdex-data");
	});

	it("shows the setup steps when the repository is missing", async () => {
		mocks.listRepositories.mockResolvedValue([]);
		await mount();
		await wait();

		expect(text()).toContain("The repository gamerdex-data was not found");
		expect(button("Create repository") ?? container.querySelector("a")).toBeTruthy();
		expect(button("Choose repositories on GitHub")).toBeTruthy();
		expect(mocks.runSync).not.toHaveBeenCalled();
	});

	it("refuses a public repository", async () => {
		mocks.listRepositories.mockResolvedValue([repository("me/gamerdex-data", false)]);
		await mount();
		await wait();

		expect(text()).toContain("The repository me/gamerdex-data is public.");
		expect(deviceStore.load().repository).toBeNull();
	});

	it("says so when the repositories cannot be loaded, and checks again", async () => {
		mocks.listRepositories.mockRejectedValueOnce(new Error("Offline."));
		await mount();
		await wait();
		expect(text()).toContain("Your repositories could not be loaded.");

		mocks.listRepositories.mockResolvedValue([repository("me/gamerdex-data", true)]);
		mocks.runSync.mockResolvedValue(synced());
		await click(button("Check again"));
		await wait();

		expect(deviceStore.load().repository).toBe("me/gamerdex-data");
	});

	it("signs out from the repository step", async () => {
		mocks.listRepositories.mockResolvedValue([]);
		await mount();
		await wait();

		await click(button("Sign out"));

		expect(deviceStore.load().tokens).toBeNull();
		expect(text()).toContain("Connect Google Drive");
	});
});

describe("The sign in callback", () => {
	const callback = async (search: string, expected: string | null = "check") => {
		location.search = search;
		deviceStore.update({ provider: "google", signInState: expected });
		await mount(<SyncCallbackPage />);
		await wait();
	};

	it("finishes the sign in and goes back to the tab", async () => {
		mocks.signIn.mockResolvedValue(tokens);
		await callback("?code=abc&state=check");

		expect(mocks.signIn).toHaveBeenCalledWith("abc", "https://tracker.test/sync/callback");
		expect(mocks.replace).toHaveBeenCalledWith("/settings?tab=sync");
		expect(deviceStore.load().signInState).toBeNull();
		expect(deviceStore.load().activity[0]).toMatchObject({
			kind: "connected",
			provider: "google",
		});
	});

	it.each([
		["?error=access_denied&state=check", "The sign in was cancelled."],
		["?state=check", "The sign in sent no code. Start again from Settings."],
		["?code=abc&state=other", "The sign in could not be checked. Start again from Settings."],
	])("explains %s", async (search, message) => {
		await callback(search);

		expect(text()).toContain(message);
		expect(mocks.signIn).not.toHaveBeenCalled();
		expect(mocks.replace).not.toHaveBeenCalled();
		expect(container.querySelector("a")!.getAttribute("href")).toBe("/settings?tab=sync");
	});

	it("explains a sign in that the service refused", async () => {
		mocks.signIn.mockRejectedValue(new ProviderError("auth", "No.", 400));
		await callback("?code=abc&state=check");

		expect(text()).toContain("The sign in could not be finished. Try again later.");
	});

	it("chooses a repository first when the provider is GitHub", async () => {
		mocks.signIn.mockResolvedValue(tokens);
		location.search = "?code=abc&state=check";
		deviceStore.update({ provider: "github", signInState: "check" });
		await mount(<SyncCallbackPage />);
		await wait();

		expect(mocks.replace).toHaveBeenCalledWith("/settings?tab=sync");
		expect(deviceStore.load().activity).toEqual([]);
	});
});

describe("Reset all data with sync on", () => {
	beforeEach(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
		connect();
		mocks.runSync.mockResolvedValue(synced());
		mocks.search = "tab=data";
	});

	const openReset = async () => {
		await mount();
		await click(button("Reset all data"));
		return document.body.querySelector("dialog[open]")!;
	};

	it("offers to delete the synced copy too, and keeps it by default", async () => {
		const dialog = await openReset();

		const box = dialog.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
		expect(dialog.textContent).toContain("Also delete the synced copy in Google Drive");
		expect(box.checked).toBe(false);
		expect(dialog.textContent).toContain("Sync disconnects on this browser");
	});

	it("disconnects sync when the synced copy stays, so the empty list never reaches the cloud", async () => {
		const dialog = await openReset();
		mocks.runSync.mockClear();

		await click(
			[...dialog.querySelectorAll("button")].find(
				(b) => b.textContent === "Yes, reset all data"
			)
		);

		expect(storageService.load().playthroughs).toEqual([]);
		expect(deviceStore.load()).toMatchObject({ provider: null, tokens: null });
		expect(document.body.textContent).toContain("Sync is disconnected on this browser.");
		expect(mocks.runSync).not.toHaveBeenCalled();
	});

	it("keeps sync on when the player also deletes the synced copy, and says the others lose it", async () => {
		const dialog = await openReset();
		await click(dialog.querySelector('input[type="checkbox"]'));
		expect(dialog.textContent).toContain("Your other devices lose these playthroughs");

		await click(
			[...dialog.querySelectorAll("button")].find(
				(b) => b.textContent === "Yes, reset all data"
			)
		);

		expect(storageService.load().playthroughs).toEqual([]);
		expect(deviceStore.load().provider).toBe("google");
		expect(document.body.textContent).not.toContain("Sync is disconnected");
	});

	it("shows no such choice while sync is off", async () => {
		deviceStore.update({ provider: null, tokens: null, state: null });
		const dialog = await openReset();

		expect(dialog.querySelector('input[type="checkbox"]')).toBeNull();
	});
});
