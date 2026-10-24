import type { HeartEvent } from "@/types";
import type { Playthrough } from "@/types/app";
import { villagersText } from "@/lib/messages/villagers";
import {
  progressOf,
  setEventSeen,
  setHearts,
  setStatus,
  trackGift,
  untrackGift,
} from "@/service/villagers";
import type { RelationshipStatus } from "@/service/villagers";
import { useFarmEdit } from "../farm/useFarmEdit";

const note = villagersText.note;

/** Every change a villager card or the villager window can make. Hearts and status say what moved. */
export function useVillagerEdits(playthrough: Playthrough) {
  const { edit, editWithNote } = useFarmEdit(playthrough.id, playthrough.data);

  const hearts = (name: string, value: number) =>
    editWithNote(
      (data) => setHearts(data, name, value),
      (_before, after) => {
        const next = progressOf(after, name);
        return {
          title: note.hearts(name, next.hearts, next.heartPoints),
          undo: note.undo,
        };
      },
    );

  const status = (name: string, value: RelationshipStatus) =>
    editWithNote(
      (data) => setStatus(data, name, value),
      (before, after) => {
        const label = villagersText.status[value];
        const loweredTo = progressOf(after, name).hearts;
        return {
          title:
            loweredTo < progressOf(before, name).hearts
              ? note.statusCapped(name, label, loweredTo)
              : note.status(name, label),
          undo: note.undo,
        };
      },
    );

  const eventSeen = (name: string, event: HeartEvent, seen: boolean) =>
    edit((data) => setEventSeen(data, name, event, seen));

  const tracking = (
    villagerName: string,
    itemName: string,
    preference: "loves" | "likes",
    tracked: boolean,
  ) =>
    edit((data) =>
      tracked
        ? trackGift(data, villagerName, itemName, preference)
        : untrackGift(data, villagerName, itemName),
    );

  return { hearts, status, eventSeen, tracking };
}
