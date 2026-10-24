"use client";

import type { Theme } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { settingsText } from "@/lib/messages/settings";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";

const text = settingsText.preferences.appearance;

const OPTIONS: { id: Theme; label: string }[] = [
	{ id: "light", label: text.themes.light },
	{ id: "dark", label: text.themes.dark },
	{ id: "system", label: text.themes.system },
];

export function ThemeChoice() {
	const { settings, updateSettings } = usePlaythrough();

	return (
		<SegmentedControl
			label={text.themeLabel}
			options={OPTIONS}
			value={settings.theme ?? "system"}
			onChange={(theme) => updateSettings({ theme })}
		/>
	);
}
