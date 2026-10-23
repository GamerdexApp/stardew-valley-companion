"use client";

import { Suspense } from "react";
import { useUrlTab } from "@/lib/hooks/useUrlTab";
import { settingsText } from "@/lib/messages/settings";
import { PageHeader } from "@/comps/shell/PageHeader";
import { Tabs } from "@/comps/ui/Tabs";
import { AboutTab } from "./AboutTab";
import { DataTab } from "./DataTab";
import { PreferencesTab } from "./PreferencesTab";

const text = settingsText.page;
const tabIds = ["preferences", "data", "about"] as const;

function SettingsContent() {
	const [activeTab, setActiveTab] = useUrlTab(tabIds, "preferences");

	return (
		<>
			<PageHeader title={text.title} subline={text.subline} />
			<Tabs
				label={text.tabsLabel}
				tabs={tabIds.map((id) => ({ id, label: text.tabs[id] }))}
				activeId={activeTab}
				onChange={setActiveTab}
			>
				{activeTab === "preferences" && <PreferencesTab />}
				{activeTab === "data" && <DataTab />}
				{activeTab === "about" && <AboutTab />}
			</Tabs>
		</>
	);
}

export function SettingsPage() {
	return (
		<Suspense fallback={null}>
			<SettingsContent />
		</Suspense>
	);
}
