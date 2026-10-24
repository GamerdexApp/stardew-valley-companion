export const calendarText = {
  title: "Calendar",
  subline: "Birthdays, festivals, and seasonal events",
  sublineToday: (season: string, day: number, year: number) =>
    `Birthdays, festivals, and seasonal events · ${season} ${day}, Year ${year}`,
  seasons: {
    spring: "Spring",
    summer: "Summer",
    fall: "Fall",
    winter: "Winter",
  },
  seasonLabel: "Season",
  now: "Now",
  layersLabel: "Show",
  layers: {
    birthdays: "Birthdays",
    festivals: "Festivals",
    bookseller: "Bookseller",
  },
  grid: {
    label: (season: string) => `${season} calendar`,
    cell: (season: string, day: number, count: number) =>
      count === 0
        ? `${season} ${day}, no events`
        : `${season} ${day}, ${count} event${count === 1 ? "" : "s"}`,
    today: "Today",
    hint: "Today is highlighted only while you view the current season. Days with events open in the panel below. Days without events stay inactive. The calendar is read only because it is derived from game data.",
    hintShort:
      "Tap a day with small pictures to open it. The pictures match the Show chips above. Today is outlined and its number is filled.",
  },
  panel: {
    title: (season: string, day: number) => `${season} ${day}`,
    today: "Today",
    tomorrow: "Tomorrow",
    empty: "Select a day with events to see what happens.",
    previous: (season: string, day: number) => `${season} ${day}`,
    next: (season: string, day: number) => `${season} ${day}`,
    previousLabel: "Previous day with events",
    nextLabel: "Next day with events",
    birthdays: "Birthdays",
    birthday: (name: string) => `${name}'s Birthday`,
    giftIdeas: (pronoun: string) => `Gift ideas from ${pronoun} preferences`,
    giftIdeasPlain: "Gift ideas from their preferences",
    loved: "Loved",
    liked: "Liked",
    open: (name: string) => `Open ${name}`,
    festivals: "Festivals",
    noFestival: "No festival on this day.",
    festivalDay: (day: number, total: number) => `Day ${day} of ${total}`,
    bookseller: "Bookseller",
    bookSellerYes:
      "Possible visit day. The Bookseller appears on some days of each season.",
    bookSellerNo: "Not a possible Bookseller day.",
    maySeeOn: (season: string, days: number[]) =>
      `He may visit on ${season} ${days.join(", ")}.`,
    close: "Close",
  },
  thisSeason: {
    title: "This season",
    badge: (count: number) => `${count} events`,
    when: (season: string, day: number) => `${season} ${day}`,
  },
  inSeason: {
    title: (season: string) => `In season: ${season}`,
    source: "From the game data",
    crops: "Crops",
    forageables: "Forageables",
    fish: "Fish",
    more: (count: number) => `+${count} more`,
    fewer: "Show fewer",
    note: "Quests and Help Wanted boards are not in the game data, so they are not shown.",
  },
};
