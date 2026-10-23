import { artifacts as queryArtifacts } from "stardew-valley-data";
import type { Artifact } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import { countArtifactsFound } from "@/lib/utils/collectionCounts";
import type { ProgressCount } from "@/lib/utils/collectionCounts";
import { museumStatus } from "./museum";

export const allArtifacts: Artifact[] = queryArtifacts().get();

export type DonationFilter = "all" | "donated" | "not-donated";
export type FoundFilter = "all" | "found" | "not-found";
export type RewardFilter = "all" | "has-reward";

export interface ArtifactFilters {
  query: string;
  donation: DonationFilter;
  found: FoundFilter;
  reward: RewardFilter;
}

export const emptyArtifactFilters: ArtifactFilters = {
  query: "",
  donation: "all",
  found: "all",
  reward: "all",
};

export const isFilteringArtifacts = (filters: ArtifactFilters): boolean =>
  JSON.stringify(filters) !== JSON.stringify(emptyArtifactFilters);

export const filterArtifacts = (
  data: GameData,
  filters: ArtifactFilters,
): Artifact[] => {
  const needle = filters.query.trim().toLowerCase();
  return allArtifacts.filter((artifact) => {
    const status = museumStatus(data, "artifacts", artifact.id);
    const found = status !== "missing";
    const donated = status === "donated";
    return (
      artifact.name.toLowerCase().includes(needle) &&
      (filters.donation === "all" ||
        (filters.donation === "donated") === donated) &&
      (filters.found === "all" || (filters.found === "found") === found) &&
      (filters.reward === "all" || artifact.donationNotes !== null)
    );
  });
};

export interface ArtifactSummary {
  total: number;
  found: ProgressCount;
  donated: number;
  withRewards: number;
}

export const artifactSummary = (data: GameData): ArtifactSummary => ({
  total: allArtifacts.length,
  found: countArtifactsFound(data),
  donated: allArtifacts.filter(
    (artifact) => museumStatus(data, "artifacts", artifact.id) === "donated",
  ).length,
  withRewards: allArtifacts.filter(
    (artifact) => artifact.donationNotes !== null,
  ).length,
});
