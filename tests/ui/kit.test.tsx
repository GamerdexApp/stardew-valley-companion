import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { Button } from "@/comps/ui/Button";
import { Dialog } from "@/comps/ui/Dialog";
import { Field } from "@/comps/ui/Field";
import { IconButton } from "@/comps/ui/IconButton";
import { Input } from "@/comps/ui/Input";
import { ProgressBar } from "@/comps/ui/ProgressBar";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Switch } from "@/comps/ui/Switch";
import { Tabs } from "@/comps/ui/Tabs";
import { ValueStepper } from "@/comps/ui/ValueStepper";

const noop = () => {};

describe("ui kit renders with its accessibility basics", () => {
	it("Button is a button that does not submit forms, and loading disables it", () => {
		const html = renderToString(<Button loading>Save</Button>);

		expect(html).toContain('type="button"');
		expect(html).toContain("disabled");
	});

	it("IconButton carries its label", () => {
		const html = renderToString(<IconButton label="Close">x</IconButton>);

		expect(html).toContain('aria-label="Close"');
	});

	it("Switch announces its state", () => {
		const html = renderToString(<Switch checked onChange={noop} label="Sync" />);

		expect(html).toContain('role="switch"');
		expect(html).toContain('aria-checked="true"');
	});

	it("Tabs marks the active tab and names the tab list", () => {
		const html = renderToString(
			<Tabs
				label="Collections"
				tabs={[
					{ id: "fish", label: "Fish", count: 77 },
					{ id: "crops", label: "Crops", locked: true },
				]}
				activeId="fish"
				onChange={noop}
			>
				panel
			</Tabs>
		);

		expect(html).toContain('aria-label="Collections"');
		expect(html).toContain('aria-selected="true"');
		expect(html).toContain("(locked)");
	});

	it("ValueStepper labels both buttons", () => {
		const html = renderToString(
			<ValueStepper label="Hearts" value={4} min={0} max={10} onChange={noop} />
		);

		expect(html).toContain('aria-label="Lower Hearts"');
		expect(html).toContain('aria-label="Raise Hearts"');
	});

	it("SegmentedControl is a named group of radios", () => {
		const html = renderToString(
			<SegmentedControl
				label="Theme"
				options={[
					{ id: "light", label: "Light" },
					{ id: "dark", label: "Dark" },
				]}
				value="light"
				onChange={noop}
			/>
		);

		expect(html).toContain("Theme");
		expect(html.match(/type="radio"/g)).toHaveLength(2);
	});

	it("Field ties its label to the input and shows the error", () => {
		const html = renderToString(
			<Field label="Name" error="Required">
				<Input />
			</Field>
		);
		const labelFor = html.match(/for="([^"]+)"/)?.[1];

		expect(labelFor).toBeDefined();
		expect(html).toContain(`id="${labelFor}"`);
		expect(html).toContain('aria-invalid="true"');
		expect(html).toContain("Required");
	});

	it("ProgressBar names what it measures", () => {
		const html = renderToString(<ProgressBar value={0.5} label="Fish caught" />);

		expect(html).toContain("Fish caught");
	});

	it("Dialog mounts its children only while open", () => {
		const closed = renderToString(
			<Dialog open={false} onClose={noop} title="Edit">
				body text
			</Dialog>
		);
		const open = renderToString(
			<Dialog open onClose={noop} title="Edit">
				body text
			</Dialog>
		);

		expect(closed).not.toContain("body text");
		expect(open).toContain("body text");
		expect(open).toContain("Edit");
	});
});
