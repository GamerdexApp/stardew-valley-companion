import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { AppData } from "@/types/app";
import { PlaythroughProvider } from "@/lib/contexts/PlaythroughContext";
import { UIProvider } from "@/lib/contexts/UIContext";
import { STORAGE_KEY } from "@/service/storage";
import { SidebarContent } from "@/comps/shell/SidebarContent";
import { ToastProvider } from "@/comps/ui/Toast";
import { emptyPlaythrough } from "../storage/fixtures";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ replace: vi.fn() }),
	usePathname: () => "/community-center",
	useSearchParams: () => new URLSearchParams(""),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLElement;

const seed = (jojaMember: boolean) => {
	const playthrough = emptyPlaythrough();
	playthrough.data.joja.isMember = jojaMember;
	const data: AppData = { playthroughs: [playthrough], activePlaythroughId: playthrough.id };
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const mount = async () => {
	await act(async () => {
		root.render(
			<UIProvider>
				<ToastProvider>
					<PlaythroughProvider>
						<SidebarContent />
					</PlaythroughProvider>
				</ToastProvider>
			</UIProvider>
		);
	});
};

const link = () => container.querySelector('nav a[href="/community-center"]') as HTMLAnchorElement;

beforeEach(() => {
	localStorage.clear();
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
});

describe("Sidebar", () => {
	it("shows Community Center for a farm on that route", async () => {
		seed(false);
		await mount();

		expect(link().textContent).toBe("Community Center");
		expect(link().getAttribute("aria-current")).toBe("page");
	});

	it("shows Joja Development for a Joja farm, at the same address", async () => {
		seed(true);
		await mount();

		expect(link().textContent).toBe("Joja Development");
		expect(container.querySelectorAll('nav a[href="/community-center"]')).toHaveLength(1);
		expect(container.textContent).not.toContain("Community Center");
	});

	it("shows Community Center when there is no playthrough", async () => {
		await mount();

		expect(link().textContent).toBe("Community Center");
	});
});
