"use client";

import type { Platform } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { formatShortDate } from "@/lib/format";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { settingsText } from "@/lib/messages/settings";
import { PLATFORMS } from "@/data/constants/platforms";
import { NEW_PLAYTHROUGH_HREF } from "@/data/nav";
import { ButtonLink } from "@/comps/ui/Button";
import { RadioGroup } from "@/comps/ui/RadioGroup";
import { Select } from "@/comps/ui/Select";
import { useToast } from "@/comps/ui/Toast";
import { SettingsCard } from "./SettingsCard";

const text = settingsText.preferences;
const themes = text.appearance.themes;

function PlaythroughSettings() {
	const { playthroughs, setPlatform, updateData } = usePlaythrough();
	const showToast = useToast();
	const copy = text.playthroughSettings;

	const change = (id: string, name: string, value: string) => {
		const platform = value === "" ? undefined : (value as Platform);
		const previous = setPlatform(id, platform);
		if (!previous) return;
		showToast({
			variant: "success",
			title: platform ? copy.changed : copy.cleared,
			message: platform ? copy.changedMessage(name, platform) : undefined,
			action: { label: copy.undo, onAction: () => updateData(() => previous) },
		});
	};

	return (
		<SettingsCard title={copy.title} description={copy.description}>
			{playthroughs.length === 0 ? (
				<>
					<p className="text-muted">{copy.none}</p>
					<div>
						<ButtonLink href={NEW_PLAYTHROUGH_HREF}>{copy.create}</ButtonLink>
					</div>
				</>
			) : (
				<ul className="flex flex-col gap-3">
					{playthroughs.map((playthrough) => (
						<li
							key={playthrough.id}
							className="flex flex-wrap items-center justify-between gap-3"
						>
							<span className="flex min-w-0 flex-col">
								<span className="truncate font-medium">{playthrough.name}</span>
								<span className="text-muted text-xs">
									{copy.lastModified(formatShortDate(playthrough.lastModified))}
								</span>
							</span>
							<div className="w-40">
								<Select
									aria-label={copy.selectLabel(playthrough.name)}
									value={playthrough.platform ?? ""}
									onChange={(event) =>
										change(playthrough.id, playthrough.name, event.target.value)
									}
								>
									{!playthrough.platform && (
										<option value="">{copy.notSet}</option>
									)}
									{PLATFORMS.map((platform) => (
										<option key={platform} value={platform}>
											{platform}
										</option>
									))}
								</Select>
							</div>
						</li>
					))}
				</ul>
			)}
		</SettingsCard>
	);
}

const themeOptions = (["light", "dark", "system"] as const).map((id) => ({
	id,
	label: themes[id],
}));

function Appearance() {
	const { settings, updateSettings } = usePlaythrough();
	const systemIsDark = useMediaQuery("(prefers-color-scheme: dark)");
	const copy = text.appearance;

	return (
		<SettingsCard title={copy.title} description={copy.description}>
			<RadioGroup
				label={copy.themeLabel}
				options={themeOptions}
				value={settings.theme ?? "system"}
				onChange={(theme) => updateSettings({ theme })}
			/>
			<p className="text-muted">
				{copy.themeNote(systemIsDark ? themes.dark : themes.light)}
			</p>
		</SettingsCard>
	);
}

export function PreferencesTab() {
	return (
		<div className="grid items-start gap-4 lg:grid-cols-2">
			<PlaythroughSettings />
			<Appearance />
		</div>
	);
}
