import type { GameData, MuseumItem } from "@/types/app";

export type MuseumKind = "artifacts" | "minerals";
export type MuseumStatus = "missing" | "found" | "donated";

const entryOf = (
  data: GameData,
  kind: MuseumKind,
  id: string,
): MuseumItem | undefined => data[kind][id];

/**
 * A donated item is found, so the status reads Donated only when both fields are set. An entry
 * that is donated but not found counts as Missing, which is how the collection totals count it.
 */
export const museumStatus = (
  data: GameData,
  kind: MuseumKind,
  id: string,
): MuseumStatus => {
  const entry = entryOf(data, kind, id);
  if (!entry?.found) return "missing";
  return entry.donated ? "donated" : "found";
};

const entryFor = (status: Exclude<MuseumStatus, "missing">): MuseumItem => ({
  found: true,
  donated: status === "donated",
});

/** Missing deletes the entry, as the old edit step did. Donated sets Found as well. */
export const setMuseumStatus = (
  data: GameData,
  kind: MuseumKind,
  id: string,
  status: MuseumStatus,
): GameData => {
  if (museumStatus(data, kind, id) === status) return data;
  const { [id]: _removed, ...rest } = data[kind];
  return {
    ...data,
    [kind]: status === "missing" ? rest : { ...rest, [id]: entryFor(status) },
  };
};

export type MuseumSideEffect = "also-found" | "cleared-both";

/** The change a tap makes beyond the status the person chose. */
export const museumSideEffect = (
  from: MuseumStatus,
  to: MuseumStatus,
): MuseumSideEffect | null => {
  if (from === "missing" && to === "donated") return "also-found";
  if (from === "donated" && to === "missing") return "cleared-both";
  return null;
};
