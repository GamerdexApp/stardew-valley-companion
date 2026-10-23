"use client";

import React, { createContext, useContext, useState, useSyncExternalStore } from "react";
import type { TrackedGift } from "@/types";
import type { AppData } from "@/types/app";
import type { PlaythroughContextType } from "@/types/contexts";
import { useIsHydrated } from "@/lib/hooks/useIsHydrated";
import { saveFailedText } from "@/lib/messages/shell";
import * as appData from "@/service/appData";
import { applyImport, downloadBackup, parseBackup } from "@/service/backup";
import type { ImportMode } from "@/service/backup";
import { storageService } from "@/service/storage";
import { useToast } from "@/comps/ui/Toast";

const PlaythroughContext = createContext<PlaythroughContextType | undefined>(undefined);

export function PlaythroughProvider({ children }: { children: React.ReactNode }) {
	const data = useSyncExternalStore(
		storageService.subscribe,
		storageService.load,
		storageService.loadOnServer
	);
	const isLoaded = useIsHydrated();
	const showToast = useToast();
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
	const [saveFailed, setSaveFailed] = useState(false);

	const updateData: PlaythroughContextType["updateData"] = (update) => {
		const previous = storageService.load();
		const next = update(previous);
		const saved = storageService.save(next);

		setSaveFailed(!saved);
		if (saved) {
			setLastSavedAt(new Date());
		} else {
			showToast({
				variant: "error",
				title: saveFailedText.title,
				message: saveFailedText.message,
				action: {
					label: saveFailedText.exportBackup,
					onAction: () => downloadBackup(next),
				},
			});
		}
		return saved ? previous : null;
	};

	const activePlaythrough =
		data.playthroughs.find((p) => p.id === data.activePlaythroughId) ?? null;

	const isManualPlaythrough = activePlaythrough?.platform !== "PC";

	const setActivePlaythrough: PlaythroughContextType["setActivePlaythrough"] = (id) => {
		updateData((current) => appData.setActivePlaythrough(current, id));
	};

	const addPlaythrough: PlaythroughContextType["addPlaythrough"] = (input) => {
		const id = crypto.randomUUID();
		const saved = updateData((current) =>
			appData.addPlaythrough(current, input, new Date(), id)
		);
		return saved ? id : null;
	};

	const updatePlaythrough: PlaythroughContextType["updatePlaythrough"] = (id, updates) => {
		updateData((current) => appData.updatePlaythrough(current, id, updates));
	};

	const deletePlaythrough: PlaythroughContextType["deletePlaythrough"] = (id) =>
		updateData((current) => appData.deletePlaythrough(current, id));

	const setPlatform: PlaythroughContextType["setPlatform"] = (id, platform) =>
		updateData((current) => appData.setPlatform(current, id, platform));

	const updateSettings: PlaythroughContextType["updateSettings"] = (updates) => {
		updateData((current) => appData.updateSettings(current, updates));
	};

	const importData = (jsonString: string, mode: ImportMode = "replace") => {
		const parsed = parseBackup(jsonString);
		if (!parsed.ok) return { success: false, error: parsed.error };

		const saved = updateData((current) => applyImport(current, parsed.data, mode));
		return saved
			? { success: true }
			: { success: false, error: "The browser could not save the data." };
	};

	const exportData = () => JSON.stringify(storageService.load(), null, 2);

	const addTrackedGift = (gift: TrackedGift) => {
		if (!activePlaythrough) return;
		const existing = activePlaythrough.data.trackedGifts ?? [];
		const alreadyTracked = existing.some(
			(g) => g.itemName === gift.itemName && g.villagerName === gift.villagerName
		);
		if (alreadyTracked) return;
		updatePlaythrough(activePlaythrough.id, {
			data: { ...activePlaythrough.data, trackedGifts: [...existing, gift] },
		});
	};

	const removeTrackedGift = (itemName: string, villagerName: string) => {
		if (!activePlaythrough) return;
		const existing = activePlaythrough.data.trackedGifts ?? [];
		updatePlaythrough(activePlaythrough.id, {
			data: {
				...activePlaythrough.data,
				trackedGifts: existing.filter(
					(g) => !(g.itemName === itemName && g.villagerName === villagerName)
				),
			},
		});
	};

	return (
		<PlaythroughContext.Provider
			value={{
				appData: data as AppData,
				playthroughs: data.playthroughs,
				activePlaythrough,
				isManualPlaythrough,
				settings: data.settings ?? {},
				isLoaded,
				lastSavedAt,
				saveFailed,
				updateData,
				setActivePlaythrough,
				addPlaythrough,
				updatePlaythrough,
				deletePlaythrough,
				setPlatform,
				updateSettings,
				importData,
				exportData,
				addTrackedGift,
				removeTrackedGift,
			}}
		>
			{children}
		</PlaythroughContext.Provider>
	);
}

export function usePlaythrough() {
	const context = useContext(PlaythroughContext);
	if (context === undefined) {
		throw new Error("usePlaythrough must be used within a PlaythroughProvider");
	}
	return context;
}
