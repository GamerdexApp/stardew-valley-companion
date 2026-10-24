import type { GameData } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { changeGameData } from "@/service/appData";
import { useToast } from "@/comps/ui/Toast";

/**
 * Writes a change to the playthrough at once. A change that does more than the player asked for
 * can name it in a toast with Undo, which puts the data from before back.
 */
export type EditNote = (
  change: (current: GameData) => GameData,
  note: (
    before: GameData,
    after: GameData,
  ) => { title: string; undo: string } | null,
) => void;

export function useFarmEdit(playthroughId: string, data: GameData) {
  const { updateData } = usePlaythrough();
  const showToast = useToast();

  const edit = (change: (current: GameData) => GameData) =>
    updateData((current) => changeGameData(current, playthroughId, change));

  const editWithNote = (
    change: (current: GameData) => GameData,
    note: (
      before: GameData,
      after: GameData,
    ) => { title: string; undo: string } | null,
  ) => {
    const result = note(data, change(data));
    const previous = edit(change);
    if (!previous || !result) return;
    showToast({
      variant: "success",
      title: result.title,
      action: {
        label: result.undo,
        onAction: () => updateData(() => previous),
      },
    });
  };

  return { edit, editWithNote };
}
