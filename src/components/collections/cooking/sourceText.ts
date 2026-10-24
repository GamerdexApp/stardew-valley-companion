import type { CookedDish } from "stardew-valley-data";
import { collectionsText } from "@/lib/messages/collections";

const text = collectionsText.cooking.source;

type RecipeSource = CookedDish["recipeSources"][number];

const capitalize = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);

/** The short line on a card. */
export function shortSource(source: RecipeSource): string {
  switch (source.type) {
    case "friendship":
      return text.friendship(source.villager, source.hearts);
    case "queen-of-sauce":
      return text.queenOfSauce;
    case "purchase":
      return text.purchase(source.from);
    case "skill":
      return text.skill(source.skill, source.level);
    case "cutscene":
      return text.event;
    case "default":
      return text.starter;
  }
}

const priceOf = (price: number, currency: string): string =>
  currency === "g"
    ? `${price.toLocaleString()}g`
    : `${price.toLocaleString()} ${currency}`;

/** The full line in the dialog, with the date, the price or the event. */
export function fullSource(source: RecipeSource): string {
  switch (source.type) {
    case "queen-of-sauce":
      return text.queenOfSauceOn(
        capitalize(source.season),
        source.day,
        source.year,
      );
    case "purchase":
      return text.purchaseFor(
        source.from,
        priceOf(source.price, source.currency),
      );
    case "cutscene":
      return text.eventDescribed(source.description);
    default:
      return shortSource(source);
  }
}
