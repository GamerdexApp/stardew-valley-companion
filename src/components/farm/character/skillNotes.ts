import type { GameData } from "@/types/app";
import { farmText } from "@/lib/messages/farm";
import { professionsLostBy } from "@/service/character";

const copy = farmText.character.skills;

/** A lower level can take professions with it. The toast names them and offers Undo. */
export const lostProfessionsNote = (before: GameData, after: GameData) => {
  const lost = professionsLostBy(before, after);
  if (lost.length === 0) return null;
  return {
    title: copy.lowered(lost.map((profession) => profession.name).join(", ")),
    undo: copy.undo,
  };
};
