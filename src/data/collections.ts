export type CollectionTabId =
  | "overview"
  | "fish"
  | "artifacts"
  | "minerals"
  | "cooking"
  | "crafting"
  | "crops"
  | "forageables"
  | "animal-products"
  | "artisan-goods"
  | "monster-loot"
  | "rarecrows"
  | "special-items";

export type CollectionGroupId = "inGame" | "farm";

export const COLLECTION_GROUPS: {
  id: CollectionGroupId;
  tabs: CollectionTabId[];
}[] = [
  {
    id: "inGame",
    tabs: ["overview", "fish", "artifacts", "minerals", "cooking", "crafting"],
  },
  {
    id: "farm",
    tabs: [
      "crops",
      "forageables",
      "animal-products",
      "artisan-goods",
      "monster-loot",
      "rarecrows",
      "special-items",
    ],
  },
];

export const COLLECTION_TAB_IDS: CollectionTabId[] = COLLECTION_GROUPS.flatMap(
  (group) => group.tabs,
);

export const DEFAULT_COLLECTION_TAB: CollectionTabId = "overview";

/** Tabs that are rebuilt. The others show a note and a link to their old page. */
export const REBUILT_COLLECTION_TABS: CollectionTabId[] = ["overview", "fish", "artifacts", "minerals"];
