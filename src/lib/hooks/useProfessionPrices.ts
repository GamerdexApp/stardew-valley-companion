import type { KnowledgeBonus, ProfessionBonus } from "stardew-valley-data";
import type { GameData } from "@/types/app";
import {
  applyBestForageableBonus,
  getActiveKnowledgeBonuses,
  getActiveProfessionBonuses,
  getStackedBonuses,
} from "@/lib/utils/professionPrices";
import type { BonusResult } from "@/lib/utils/professionPrices";
import { useMemoryState } from "./useMemoryState";

export type PriceBonusId = ProfessionBonus | KnowledgeBonus;

export interface ProfessionOption {
  id: PriceBonusId;
  label: string;
}

interface ProfessionState {
  enabled: boolean;
  /** Null means every bonus the playthrough has. */
  chosen: PriceBonusId[] | null;
}

const KNOWLEDGE_IDS: readonly string[] = [
  "bears-knowledge",
  "spring-onion-mastery",
];

/**
 * The page level Professions control of a collections tab. The choice is a display preference
 * kept in memory only. The control lists the candidates the playthrough has, and a candidate can
 * be a profession or a knowledge bonus.
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

  const ownedProfessions = getActiveProfessionBonuses(data);
  const ownedKnowledge = getActiveKnowledgeBonuses(data);
  const isOwned = (id: PriceBonusId): boolean =>
    KNOWLEDGE_IDS.includes(id)
      ? ownedKnowledge.has(id as KnowledgeBonus)
      : ownedProfessions.has(id as ProfessionBonus);

  const available = candidates.filter((option) => isOwned(option.id));
  const chosen = state.chosen ?? available.map((option) => option.id);
  const switchedOn = state.enabled ? chosen.filter(isOwned) : [];
  const activeProfessions = new Set(
    switchedOn.filter((id) => !KNOWLEDGE_IDS.includes(id)) as ProfessionBonus[],
  );
  const activeKnowledge = new Set(
    switchedOn.filter((id) => KNOWLEDGE_IDS.includes(id)) as KnowledgeBonus[],
  );

  /** The better of the profession price and the knowledge price. They do not stack in the game. */
  const bonusFor = (
    price: number,
    itemProfessions: ProfessionBonus[],
    itemKnowledge: KnowledgeBonus[] = [],
  ): BonusResult | null =>
    switchedOn.length > 0
      ? applyBestForageableBonus(
          price,
          itemProfessions,
          itemKnowledge,
          activeProfessions,
          activeKnowledge,
        )
      : null;

  /**
   * The rows for an item where professions stack, such as Smoked Fish (Fisher, then Fisher and
   * Artisan). An item with one profession gets its single best row.
   */
  const rowsFor = (
    price: number,
    itemProfessions: ProfessionBonus[],
  ): BonusResult[] => {
    if (switchedOn.length === 0) return [];
    if (itemProfessions.length > 1 && itemProfessions.includes("artisan")) {
      return getStackedBonuses(price, itemProfessions, activeProfessions);
    }
    const single = bonusFor(price, itemProfessions);
    return single ? [single] : [];
  };

  return {
    control: {
      available,
      enabled: state.enabled,
      chosen,
      onEnabledChange: (enabled: boolean) => setState({ ...state, enabled }),
      onChosenChange: (next: string[]) =>
        setState({ ...state, chosen: next as PriceBonusId[] }),
    },
    bonusFor,
    rowsFor,
  };
}
