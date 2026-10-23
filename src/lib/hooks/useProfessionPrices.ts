import type { ProfessionBonus } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import {
  applyBestProfessionBonus,
  getActiveProfessionBonuses,
} from "@/lib/utils/professionPrices";
import type { BonusResult } from "@/lib/utils/professionPrices";
import { useMemoryState } from "./useMemoryState";

export interface ProfessionOption {
  id: ProfessionBonus;
  label: string;
}

interface ProfessionState {
  enabled: boolean;
  /** Null means every profession the playthrough has. */
  chosen: ProfessionBonus[] | null;
}

/**
 * The page level Professions control of a collections tab. The choice is a display preference
 * kept in memory only. The control lists the candidates the playthrough has.
 */
export function useProfessionPrices(
  key: string,
  data: GameData,
  candidates: readonly ProfessionOption[],
) {
  const [state, setState] = useMemoryState<ProfessionState>(key, {
    enabled: false,
    chosen: null,
  });

  const owned = getActiveProfessionBonuses(data);
  const available = candidates.filter((option) => owned.has(option.id));
  const chosen = state.chosen ?? available.map((option) => option.id);
  const active = new Set<ProfessionBonus>(
    state.enabled ? chosen.filter((id) => owned.has(id)) : [],
  );

  const bonusFor = (
    price: number,
    itemProfessions: ProfessionBonus[],
  ): BonusResult | null =>
    active.size > 0
      ? applyBestProfessionBonus(price, itemProfessions, active)
      : null;

  return {
    control: {
      available,
      enabled: state.enabled,
      chosen,
      onEnabledChange: (enabled: boolean) => setState({ ...state, enabled }),
      onChosenChange: (next: string[]) =>
        setState({ ...state, chosen: next as ProfessionBonus[] }),
    },
    bonusFor,
  };
}
