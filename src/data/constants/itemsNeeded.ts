import {
  artifacts,
  artisanGoods,
  buildings,
  collections,
  cooking,
  crafting,
  crops,
  fish,
  forageables,
  minerals,
  mixedSeeds,
  monsterLoot,
  trees,
} from "stardew-valley-data";

export const MAGICAL_BUILDING_NAMES = [
  "Earth Obelisk",
  "Water Obelisk",
  "Desert Obelisk",
  "Island Obelisk",
  "Gold Clock",
];

export const ITEMS_NEEDED_DATA = {
  mineralItems: minerals().mineralItems().get(),
  artifacts: artifacts().get(),
  shippableItems: collections().itemsShipped().get(),
  cookingDishes: cooking().get(),
  craftingRecipes: crafting().get(),
  obelisks: buildings()
    .magical()
    .get()
    .filter((b) => MAGICAL_BUILDING_NAMES.includes(b.name)),
};

const MANUAL_IMAGE_OVERRIDES: Record<string, string> = {
  "Any Egg": "images/animals/produce/Large Egg.png",
  "Any Milk": "images/animals/produce/Large Milk.png",
  "Any Fish": "images/fish/Sardine.png",
  Rice: "images/crops/unmilled-rice/crop.png",
};

function buildItemImageMap(): Map<string, string> {
  const map = new Map<string, string>(Object.entries(MANUAL_IMAGE_OVERRIDES));

  function add(name: string, image: string) {
    if (!map.has(name)) map.set(name, image);
  }

  for (const item of minerals().get()) add(item.name, item.image);
  for (const item of minerals().ores().get()) add(item.name, item.image);
  for (const item of minerals().bars().get()) add(item.name, item.image);
  for (const item of minerals().resources().get()) add(item.name, item.image);
  for (const item of artifacts().get()) add(item.name, item.image);
  for (const item of cooking().get()) add(item.name, item.image);
  for (const item of crafting().get()) {
    if (item.output) add(item.output.name, item.image);
    add(item.name, item.image);
  }
  for (const item of fish().get()) add(item.name, item.image);
  for (const item of forageables().get()) add(item.name, item.image);
  for (const item of crops().get()) {
    add(item.name, item.image);
    if (item.seedName && item.seedImage) add(item.seedName, item.seedImage);
  }
  for (const item of monsterLoot().get()) add(item.name, item.image);
  for (const item of artisanGoods().get()) add(item.name, item.image);
  for (const item of mixedSeeds().get()) add(item.name, item.image);
  for (const item of collections().itemsShipped().get())
    add(item.name, item.image);
  for (const tree of trees().get()) {
    if ("produce" in tree && tree.produce && typeof tree.produce === "object") {
      const produce = tree.produce as { name: string; image: string };
      add(produce.name, produce.image);
    }
    if (
      "seedName" in tree &&
      tree.seedName &&
      "seedImage" in tree &&
      tree.seedImage
    ) {
      add(tree.seedName as string, tree.seedImage as string);
    }
    if (
      "saplingName" in tree &&
      tree.saplingName &&
      "saplingImage" in tree &&
      tree.saplingImage
    ) {
      add(tree.saplingName as string, tree.saplingImage as string);
    }
  }

  return map;
}

export const ITEM_IMAGE_MAP = buildItemImageMap();
