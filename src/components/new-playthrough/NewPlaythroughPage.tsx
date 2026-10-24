"use client";

import type { SaveData } from "stardew-valley-data";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { newPlaythroughText } from "@/lib/messages/newPlaythrough";
import {
	BUILD_STEPS,
	buildPlaythrough,
	canContinueFromBundles,
	emptyBuildForm,
	emptyBundleConfig,
	isBuildFormComplete,
	playthroughFromSave,
	summarizeBuild,
	summarizeSave,
	UPLOAD_STEPS,
} from "@/service/newPlaythrough";
import type { WizardPath } from "@/service/newPlaythrough";
import { PLAYTHROUGHS_HREF } from "@/data/nav";
import { PageHeader } from "@/comps/shell/PageHeader";
import { Button, ButtonLink } from "@/comps/ui/Button";
import { Card } from "@/comps/ui/Card";
import { Note } from "@/comps/ui/Note";
import { useToast } from "@/comps/ui/Toast";
import { BundlesStep } from "./BundlesStep";
import { CharacterStep } from "./CharacterStep";
import { ChoosePathStep } from "./ChoosePathStep";
import { ReviewStep } from "./ReviewStep";
import { StepIndicator } from "./StepIndicator";
import { UploadFileStep } from "./UploadFileStep";

const text = newPlaythroughText;

const pathFromAddress = (value: string | null): WizardPath | null =>
	value === "upload" || value === "build" ? value : null;

function Wizard() {
	const router = useRouter();
	const requested = pathFromAddress(useSearchParams().get("path"));
	const showToast = useToast();
	const { playthroughs, addPlaythrough, setActivePlaythrough } = usePlaythrough();

	const [path, setPath] = useState<WizardPath | null>(requested);
	const [step, setStep] = useState(requested ? 2 : 1);
	const [save, setSave] = useState<SaveData | null>(null);
	const [uploadName, setUploadName] = useState("");
	const [description, setDescription] = useState("");
	const [form, setForm] = useState(emptyBuildForm);
	const [bundles, setBundles] = useState(emptyBundleConfig);
	const [failed, setFailed] = useState(false);

	const steps =
		path === "upload" ? UPLOAD_STEPS : path === "build" ? BUILD_STEPS : [text.choose.heading];
	const isLastStep = path !== null && step === steps.length;

	const choosePath = (chosen: WizardPath) => {
		setPath(chosen);
		setStep(2);
	};

	const back = () => {
		if (step === 2) setPath(null);
		setStep(step - 1);
	};

	const canGoNext =
		path === "upload"
			? step === 2 && save !== null && uploadName.trim() !== ""
			: path === "build"
				? step === 2
					? isBuildFormComplete(form)
					: step === 3 && canContinueFromBundles(bundles)
				: false;

	const completeForm = isBuildFormComplete(form) ? form : null;

	const submit = () => {
		const input =
			path === "upload" && save
				? playthroughFromSave(save, uploadName, description)
				: completeForm
					? buildPlaythrough(completeForm, bundles)
					: null;
		if (!input) return;

		const isFirst = playthroughs.length === 0;
		const id = addPlaythrough(input);
		if (!id) {
			setFailed(true);
			return;
		}
		showToast({
			variant: "success",
			title: isFirst ? text.savedActive(input.name) : text.saved(input.name),
			action: {
				label: text.openOverview,
				onAction: () => {
					setActivePlaythrough(id);
					router.push("/overview");
				},
			},
		});
		router.push(PLAYTHROUGHS_HREF);
	};

	const uploadSavedAs = {
		title: text.review.willBeSavedAs,
		rows: [
			{ label: text.review.name, value: uploadName.trim() },
			{ label: text.review.platform, value: "PC" },
			{
				label: text.review.description,
				value: description.trim() || text.review.noDescription,
			},
		],
	};

	const renderStep = () => {
		if (path === null) return <ChoosePathStep onSelect={choosePath} />;
		if (path === "upload") {
			if (step === 2) {
				return (
					<UploadFileStep
						save={save}
						name={uploadName}
						description={description}
						onParsed={setSave}
						onNameChange={setUploadName}
						onDescriptionChange={setDescription}
					/>
				);
			}
			return save ? (
				<ReviewStep sections={summarizeSave(save)} savedAs={uploadSavedAs} />
			) : null;
		}
		if (step === 2) return <CharacterStep form={form} onChange={setForm} />;
		if (step === 3) return <BundlesStep config={bundles} onChange={setBundles} />;
		return completeForm ? (
			<ReviewStep
				sections={summarizeBuild(completeForm, bundles)}
				savedAs={{
					title: text.review.platformCard,
					rows: [{ label: text.review.platform, value: completeForm.platform }],
				}}
			/>
		) : null;
	};

	return (
		<>
			<StepIndicator steps={steps} currentStep={step} />
			<Card className="flex flex-col gap-4 p-4 lg:p-6">
				{renderStep()}
				{failed && (
					<div role="alert">
						<Note tone="warning">{text.saveFailed}</Note>
					</div>
				)}
				{step > 1 && (
					<div className="border-line flex justify-between gap-3 border-t-[1.5px] pt-4">
						<Button onClick={back}>{text.back}</Button>
						{isLastStep ? (
							<Button variant="primary" onClick={submit}>
								{text.save}
							</Button>
						) : (
							<Button
								variant="primary"
								disabled={!canGoNext}
								onClick={() => setStep(step + 1)}
							>
								{text.next}
							</Button>
						)}
					</div>
				)}
			</Card>
		</>
	);
}

export function NewPlaythroughPage() {
	return (
		<>
			<PageHeader
				title={text.title}
				subline={text.subline}
				actions={<ButtonLink href={PLAYTHROUGHS_HREF}>{text.cancel}</ButtonLink>}
			/>
			<Suspense fallback={null}>
				<Wizard />
			</Suspense>
		</>
	);
}
