export const perfectionText = {
  title: "Perfection",
  subline: (farm: string) => `Progress toward 100% game completion · ${farm}`,
  tiles: {
    score: "Perfection score",
    categories: "Categories complete",
    waivers: "Waivers used",
  },
  formula: {
    title: "How the score is built",
    expression:
      "score = min(100, round(sum(weight × min(current / total, 1)) / 100 × 100 + waivers))",
    weights: "Weights add up to 100.",
    sum: (base: number, score: number, waivers: number) =>
      `Weighted sum ${base.toFixed(1)} of 100 gives ${base.toFixed(1)}%. Plus ${waivers} from waivers makes ${score}%.`,
    cap: "A category never earns more than its weight.",
  },
  waivers: {
    title: "Perfection waivers",
    badge: (count: number) => `${count} used`,
    label: "Waivers used",
    raise: "Raise waivers used",
    lower: "Lower waivers used",
    boost: (count: number) => `Score boost from waivers: +${count}%`,
    each: "Each waiver adds 1% to your score.",
    cost: (cost: string) => `Cost per waiver: ${cost}g.`,
    how: "How to get one: the Perfection Tracker statue in Qi's Walnut Room, a letter from Fizz, and the mushroom cave.",
  },
  categories: {
    title: "Categories",
    hint: "Select a row to see what is still missing.",
    badge: (done: number, total: number) => `${done} / ${total} complete`,
    count: (current: number, total: number) => `${current} / ${total}`,
    percent: (share: number) => `${Math.round(share * 100)}%`,
    points: (points: number, weight: number) =>
      `${points.toFixed(1)} / ${weight} pts`,
    bar: (name: string) => `${name} progress`,
    missing: (count: number) => `Missing (${count})`,
    skillsMissing: "Skill levels still missing",
    more: (count: number) => `and ${count} more`,
    showAll: "Show all",
    showFewer: "Show fewer",
    complete: "Complete",
    open: (name: string) => `Show what is missing for ${name}`,
  },
};
