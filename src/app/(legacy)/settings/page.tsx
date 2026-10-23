"use client";

import { Alert, Badge, Button, Card, FileInput, Label, Select } from "flowbite-react";
import {
	HiCheckCircle,
	HiDownload,
	HiExclamationCircle,
	HiInformationCircle,
	HiTrash,
	HiUpload,
} from "react-icons/hi";
import { useSettingsActions } from "@/lib/pages/settings";
import { PLATFORMS } from "@/data/constants/platforms";
import type { Platform } from "@/data/constants/platforms";
import { PageHeader } from "@/comps/ui/PageHeader";

export default function Settings() {
	const {
		playthroughs,
		updatePlaythrough,
		fileInputRef,
		confirmReset,
		resetSuccess,
		importStatus,
		setImportStatus,
		handleExportData,
		handleImportData,
		handleResetData,
	} = useSettingsActions();

	return (
		<section className="bg-bg min-h-screen p-8">
			<div className="mx-auto">
				<PageHeader
					title="Settings"
					description="Manage your data and application settings"
				/>

				<div className="mb-8">
					<Alert color="info" icon={HiInformationCircle}>
						<div className="mb-1 text-lg font-medium">Local Storage</div>
						<p className="mb-1">
							Your data is stored locally in the browser. Data is lost when the
							browser cache is cleared.
						</p>
						<p>Use the functions below to export and backup your data regularly.</p>
					</Alert>
				</div>

				{importStatus?.show && (
					<Alert
						color={importStatus.success ? "success" : "failure"}
						icon={importStatus.success ? HiCheckCircle : HiExclamationCircle}
						onDismiss={() => setImportStatus(null)}
						className="mb-6"
					>
						{importStatus.message}
					</Alert>
				)}

				{playthroughs.length > 0 && (
					<Card className="mb-4">
						<h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
							Playthrough Settings
						</h2>
						<div className="space-y-3">
							{playthroughs.map((pt) => (
								<div
									key={pt.id}
									className="flex items-center justify-between gap-4"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold text-gray-800">
											{pt.name}
										</p>
									</div>
									<div className="w-36 shrink-0">
										<Select
											sizing="sm"
											value={pt.platform ?? "PC"}
											onChange={(e) =>
												updatePlaythrough(pt.id, {
													platform: e.target.value as Platform,
												})
											}
										>
											{PLATFORMS.map((p) => (
												<option key={p} value={p}>
													{p}
												</option>
											))}
										</Select>
									</div>
								</div>
							))}
						</div>
					</Card>
				)}

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<Card>
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-xl font-bold text-gray-900 dark:text-white">
								Data Management
							</h2>
							<Badge color="info">
								{playthroughs.length}{" "}
								{playthroughs.length === 1 ? "Playthrough" : "Playthroughs"}
							</Badge>
						</div>

						<div className="space-y-6">
							<div>
								<div className="mb-2">
									<Label>Export Data</Label>
								</div>
								<Button onClick={handleExportData} className="w-full">
									<HiDownload className="mr-2 h-5 w-5" />
									Export All Playthroughs
								</Button>
								<p className="mt-1 text-sm text-gray-500">
									Download a backup file of all your saved playthroughs.
								</p>
							</div>

							<div>
								<div className="mb-2">
									<Label>Import Data</Label>
								</div>
								<div className="flex flex-col gap-2">
									<FileInput ref={fileInputRef} accept=".json" />
									<p className="text-sm text-gray-500">
										Upload a previously exported file (.json)
									</p>
									<Button color="purple" onClick={handleImportData}>
										<HiUpload className="mr-2 h-5 w-5" />
										Import Data
									</Button>
								</div>
							</div>

							<div>
								<div className="mb-2">
									<Label className="text-red-500">Reset All Data</Label>
									{resetSuccess && (
										<span className="ml-2 text-sm text-green-500">
											Data reset successfully
										</span>
									)}
								</div>
								<Button color="red" onClick={handleResetData} className="w-full">
									<HiTrash className="mr-2 h-5 w-5" />
									{confirmReset ? "Confirm Reset" : "Reset All Data"}
								</Button>
								<p className="mt-1 text-sm text-red-500">
									Warning: This will delete all playthroughs and cannot be undone.
								</p>
							</div>
						</div>
					</Card>

					<Card>
						<h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
							About
						</h2>
						<div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
							<p>
								<strong className="text-gray-900 dark:text-white">
									Stardew Valley Companion
								</strong>
							</p>
							<p>
								A progress tracking tool for Stardew Valley. Track bundles,
								friendships, fish, artifacts, and more. All data is stored locally
								in your browser.
							</p>
						</div>
					</Card>
				</div>
			</div>
		</section>
	);
}
