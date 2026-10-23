import {
  artisanGoods,
  type ArtisanUses,
  crafting,
  search,
} from "stardew-valley-data";

const allCrafting = crafting().get();

export const EQUIPMENT_IMAGES: Record<string, string> = Object.fromEntries(
  allCrafting.filter((c) => c.image).map((c) => [c.name, c.image]),
);

export const ARTISAN_USE_KEY: Record<string, keyof ArtisanUses> = {
  Honey: "honey",
  Wine: "wine",
  Juice: "juice",
  Jelly: "jelly",
  Pickles: "pickles",
  "Dried Fruit": "driedFruit",
  "Dried Mushrooms": "driedMushrooms",
};

export const ARTISAN_CALC_METHOD: Record<string, string> = {
  Honey: "honey",
  Wine: "wine",
  Juice: "juice",
  Jelly: "jelly",
  Pickles: "pickles",
  "Dried Fruit": "driedFruit",
  "Dried Mushrooms": "driedMushrooms",
  "Smoked Fish": "smokedFish",
  "Aged Roe": "agedRoe",
};

export const FRUIT_TREE_KEYS = new Set(["wine", "jelly", "driedFruit"]);

export const INGREDIENT_IMAGE_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const good of artisanGoods().get()) {
    for (const ingredient of good.ingredients) {
      if (ingredient.id && !(ingredient.id in map)) {
        const results = search(ingredient.id);
        const match = results.find(
          (r) => r.name.toLowerCase() === ingredient.name.toLowerCase(),
        );
        if (match) {
          map[ingredient.id] = match.image;
        }
      }
    }
  }
  return map;
})();
