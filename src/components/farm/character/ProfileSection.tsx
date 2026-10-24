import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { formatTimePlayed, MAX_DAY, SEASONS } from "@/service/character";
import { setDate, setHouseLevel, setNumberField, setTextField } from "@/service/character";
import { Card } from "@/comps/ui/Card";
import { Field } from "@/comps/ui/Field";
import { Input } from "@/comps/ui/Input";
import { NumberInput } from "@/comps/ui/NumberInput";
import { Section } from "@/comps/ui/Section";
import { SectionLabel } from "@/comps/ui/SectionLabel";
import { SegmentedControl } from "@/comps/ui/SegmentedControl";
import { Select } from "@/comps/ui/Select";

const profile = farmText.character.profile;
const stats = farmText.character.stats;

const GENDERS: string[] = [profile.genders.male, profile.genders.female];

interface ProfileSectionProps {
	data: GameData;
	edit: (change: (current: GameData) => GameData) => void;
}

function ReadOnlyTile({ label, value }: { label: string; value: string }) {
	return (
		<Card dimmed className="flex flex-col gap-1 px-3 py-2.5">
			<SectionLabel className="text-muted">{label}</SectionLabel>
			<span className="font-mono text-sm">{value}</span>
		</Card>
	);
}

export function ProfileSection({ data, edit }: ProfileSectionProps) {
	const { character } = data;
	const genders = GENDERS.includes(character.gender) ? GENDERS : [character.gender, ...GENDERS];

	return (
		<>
			<Section title={profile.title}>
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
					<Field label={profile.name}>
						<Input
							value={character.name}
							onChange={(event) =>
								edit((d) => setTextField(d, "name", event.target.value))
							}
						/>
					</Field>
					<Field label={profile.farmName}>
						<Input
							value={character.farmName}
							onChange={(event) =>
								edit((d) => setTextField(d, "farmName", event.target.value))
							}
						/>
					</Field>
					<Field label={profile.favoriteThing}>
						<Input
							value={character.favoriteThing}
							onChange={(event) =>
								edit((d) => setTextField(d, "favoriteThing", event.target.value))
							}
						/>
					</Field>
					<Field label={profile.gender}>
						<Select
							value={character.gender}
							onChange={(event) =>
								edit((d) => setTextField(d, "gender", event.target.value))
							}
						>
							{genders.map((gender) => (
								<option key={gender} value={gender}>
									{gender || "-"}
								</option>
							))}
						</Select>
					</Field>
					<Field label={profile.spouse}>
						<Input
							value={character.spouse}
							onChange={(event) =>
								edit((d) => setTextField(d, "spouse", event.target.value))
							}
						/>
					</Field>
				</div>
				<div className="grid grid-cols-3 gap-3 md:max-w-xl">
					<Field label={profile.season}>
						<Select
							value={character.currentDate.season}
							onChange={(event) =>
								edit((d) =>
									setDate(d, {
										season: event.target.value as (typeof SEASONS)[number],
									})
								)
							}
						>
							{SEASONS.map((season) => (
								<option key={season} value={season}>
									{profile.seasons[season]}
								</option>
							))}
						</Select>
					</Field>
					<Field label={profile.day}>
						<NumberInput
							value={character.currentDate.day}
							min={1}
							max={MAX_DAY}
							onChange={(day) => edit((d) => setDate(d, { day }))}
						/>
					</Field>
					<Field label={profile.year}>
						<NumberInput
							value={character.currentDate.year}
							min={1}
							onChange={(year) => edit((d) => setDate(d, { year }))}
						/>
					</Field>
				</div>
				<div className="flex flex-col gap-1.5">
					<span className="font-medium">{profile.houseLevel}</span>
					<SegmentedControl
						label={profile.houseLevel}
						value={String(character.houseUpgradeLevel)}
						onChange={(level) => edit((d) => setHouseLevel(d, Number(level)))}
						options={profile.houseLevels.map((label, level) => ({
							id: String(level),
							label: `${level}: ${label}`,
						}))}
					/>
				</div>
			</Section>
			<Section title={stats.title}>
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
					<Field label={stats.money}>
						<NumberInput
							value={character.money}
							onChange={(value) => edit((d) => setNumberField(d, "money", value))}
						/>
					</Field>
					<Field label={stats.totalEarned}>
						<NumberInput
							value={character.totalMoneyEarned}
							onChange={(value) =>
								edit((d) => setNumberField(d, "totalMoneyEarned", value))
							}
						/>
					</Field>
					<Field label={stats.maxHealth}>
						<NumberInput
							value={character.maxHealth}
							onChange={(value) => edit((d) => setNumberField(d, "maxHealth", value))}
						/>
					</Field>
					<Field label={stats.maxEnergy}>
						<NumberInput
							value={character.maxEnergy}
							onChange={(value) => edit((d) => setNumberField(d, "maxEnergy", value))}
						/>
					</Field>
					<Field label={stats.luck}>
						<NumberInput
							value={character.luckLevel}
							step={0.01}
							onChange={(value) => edit((d) => setNumberField(d, "luckLevel", value))}
						/>
					</Field>
				</div>
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
					<ReadOnlyTile label={stats.version} value={character.gameVersion || "-"} />
					<ReadOnlyTile
						label={stats.daysPlayed}
						value={character.totalDaysPlayed.toLocaleString()}
					/>
					<ReadOnlyTile
						label={stats.timePlayed}
						value={formatTimePlayed(character.millisecondsPlayed)}
					/>
				</div>
				<p className="text-muted text-xs">{stats.readOnly}</p>
			</Section>
		</>
	);
}
