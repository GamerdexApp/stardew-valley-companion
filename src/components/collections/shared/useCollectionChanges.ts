import type { GameData } from "@/types/app";
import { usePlaythrough } from "@/lib/contexts/PlaythroughContext";
import { collectionsText } from "@/lib/messages/collections";
import { changeGameData } from "@/service/appData";
import {
  museumSideEffect,
  museumStatus,
  setMuseumStatus,
} from "@/service/museum";
import type { MuseumKind, MuseumStatus } from "@/service/museum";
import {
  recipeSideEffect,
  recipeStatus,
  setRecipeStatus,
} from "@/service/recipes";
import type { RecipeKind, RecipeStatus } from "@/service/recipes";
import { isShipped, setShipped, setShippedCount } from "@/service/shipped";
import { useToast } from "@/comps/ui/Toast";

const museumText = collectionsText.museum;
const shippedText = collectionsText.shipped;
const recipeText = collectionsText.recipes;

/** Writes a change to the playthrough and gives back the data from before it, for Undo. */
function useWriter(playthroughId: string) {
  const { updateData } = usePlaythrough();
  const showToast = useToast();

  const write = (change: (data: GameData) => GameData) =>
    updateData((current) => changeGameData(current, playthroughId, change));

  const offerUndo = (title: string, previous: ReturnType<typeof write>) => {
    if (!previous) return;
    showToast({
      variant: "success",
      title,
      action: {
        label: museumText.toast.undo,
        onAction: () => updateData(() => previous),
      },
    });
  };

  return { write, offerUndo };
}

/**
 * Changes the museum status of an artifact or mineral. A tap that changes two fields shows an
 * Undo toast that says so.
 */
export function useMuseumStatusChange(playthroughId: string, kind: MuseumKind) {
  const { write, offerUndo } = useWriter(playthroughId);

  return (data: GameData, name: string, id: string, status: MuseumStatus) => {
    const sideEffect = museumSideEffect(museumStatus(data, kind, id), status);
    const previous = write((current) =>
      setMuseumStatus(current, kind, id, status),
    );
    if (!sideEffect) return;
    offerUndo(
      sideEffect === "also-found"
        ? museumText.toast.alsoFound(name)
        : museumText.toast.clearedBoth(name),
      previous,
    );
  };
}

/**
 * Changes the status of a cooking or crafting recipe. A tap that changes two fields shows an
 * Undo toast that says so.
 */
export function useRecipeStatusChange(playthroughId: string, kind: RecipeKind) {
  const { write, offerUndo } = useWriter(playthroughId);
  const done = recipeText.doneLabel[kind];

  return (data: GameData, name: string, status: RecipeStatus) => {
    const sideEffect = recipeSideEffect(recipeStatus(data, kind, name), status);
    const previous = write((current) =>
      setRecipeStatus(current, kind, name, status),
    );
    if (!sideEffect) return;
    offerUndo(
      sideEffect === "also-learned"
        ? recipeText.toast.alsoLearned(name, done)
        : recipeText.toast.clearedBoth(name, done),
      previous,
    );
  };
}

/**
 * Changes whether an item is shipped and how many. Switching off deletes the count, so it shows
 * an Undo toast that brings the count back.
 */
export function useShippedChange(playthroughId: string) {
  const { write, offerUndo } = useWriter(playthroughId);

  return {
    setShipped: (
      data: GameData,
      name: string,
      id: string,
      shipped: boolean,
    ) => {
      const wasShipped = isShipped(data, id);
      const previous = write((current) => setShipped(current, id, shipped));
      if (wasShipped && !shipped)
        offerUndo(shippedText.toast.notShipped(name), previous);
    },
    setCount: (id: string, count: number) =>
      write((current) => setShippedCount(current, id, count)),
  };
}
