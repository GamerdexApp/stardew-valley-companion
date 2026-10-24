export const grandpaText = {
  title: "Grandpa's evaluation",
  subline: (farm: string) =>
    `Year 3 farm evaluation criteria and progress · ${farm}`,
  score: {
    title: "Grandpa's evaluation",
    next: (needed: number, candle: number) =>
      `${needed} more point${needed === 1 ? "" : "s"} lights the ${["", "first", "second", "third", "fourth"][candle]} candle.`,
    top: "All four candles are lit.",
    candle: (number: number, lit: boolean) =>
      `Candle ${number}, ${lit ? "lit" : "not lit"}`,
    steps: (points: number) => `${points}+ pts`,
  },
  tiles: {
    score: "Score",
    candles: "Candles",
    categories: "Categories complete",
  },
  categories: {
    earnings: "Earnings",
    skills: "Skills",
    achievements: "Achievements",
    friendship: "Friendship",
    "community-center": "Community Center",
    exploration: "Exploration",
  },
  notes: {
    earnings: (earned: string) =>
      `Score is the highest tier reached. Total earned so far: ${earned}. The game has no 750,000g tier.`,
    skills: (levels: number) => `Sum of the five skill levels: ${levels}.`,
    achievements:
      "Counts the achievements with ids 5, 26 and 34 from the Character tab.",
    friendship: "Villager counts leave out the spouse.",
    "community-center": (done: number, total: number) =>
      `Rooms complete: ${done} / ${total}.`,
    exploration: "",
  },
  characterLink: "Open Character",
  badge: (earned: number, max: number) => `${earned} / ${max}`,
  row: {
    points: (points: number, max: number) => `${points} / ${max}`,
    earned: "Earned",
    notEarned: "Not earned yet",
    notYet: "Not yet",
    progress: (current: string, total: string, unit: string) =>
      `${current} / ${total}${unit === "g" ? "g" : unit ? ` ${unit}` : ""}`,
    bar: (label: string) => `${label} progress`,
  },
  labels: {
    "Total Skill Levels ≥30": "Total skill levels 30 or more",
    "Total Skill Levels ≥50": "Total skill levels 50 or more",
    "A Complete Collection": "A Complete Collection",
    "Master Angler": "Master Angler",
    "Full Shipment": "Full Shipment",
    "Married with Kitchen & Nursery": "Married with kitchen and nursery",
    "5+ Villagers at 8 Hearts": "5 or more villagers at 8 hearts",
    "10+ Villagers at 8 Hearts": "10 or more villagers at 8 hearts",
    "Pet at Max Friendship": "Pet at max friendship",
    "Community Center Completed": "Community Center completed",
    "Community Center Ceremony Attended": "Ceremony attended",
    "Skull Key Obtained": "Skull key obtained",
    "Rusty Key Obtained": "Rusty key obtained",
  } as Record<string, string>,
  earningsLabel: (amount: string) => `Total earnings ${amount}g`,
  footer:
    "Derived from this playthrough, read only. Candles: 1 at 0 to 3 points, 2 at 4 to 7, 3 at 8 to 11, 4 at 12 or more.",
};
