# Stardew Valley Companion

A comprehensive Stardew Valley progress tracker and companion app built with Next.js. Track every aspect of your playthrough — from community center bundles and collections to villager hearts, farm buildings, and perfection score.

## Features

### Playthrough Management

- Create playthroughs manually or by uploading a Stardew Valley save file (PC)
- Switch between multiple playthroughs
- Full import / export / reset in settings

### Farm

- **Character** — skills, professions, mastery levels, tools, fishing rods, backpacks, pets
- **Buildings** — track farm buildings and animal counts
- **Animals** — track animal friendship and produce status
- **Ginger Island** — golden walnuts, parrot upgrades, island progress

### Collections

- **Crops** — shipped status, seasons, sell prices with profession bonuses
- **Forageables** — all forageable items by season
- **Animal Products** — eggs, milk, and artisan goods from animals
- **Artisan Goods** — profession-aware price calculator for artisan products
- **Fish** — caught status, location, season, weather, and time filters
- **Cooking** — recipes learned and cooked
- **Crafting** — recipes learned and crafted
- **Artifacts** — museum donations and found status
- **Minerals** — geode minerals, gemstones, and museum donations
- **Monster Loot** — drops from all monster categories
- **Special Items** — rarecrows, furniture, hats, rings, boots, and more

### Community & Progression

- **Community Center** — bundle completion tracking (standard and remix modes)
- **Joja Mart** — Joja membership development milestones
- **Villagers** — heart levels, birthdays, gift preferences, and marriageability
- **Quests** — special order and story quest tracking
- **Grandpa's Evaluation** — score and candle tracking
- **Mines & Monsters** — floor progress, elevator level, monster eradication goals
- **Perfection** — overall perfection percentage with per-category breakdown
- **Calendar** — seasonal item and birthday calendar view
- **Items Needed** — aggregated view of items still needed across all goals
- **Town** — town and world unlock progress
- **Gear** — equipment tracking

## Tech Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript 6** (strict)
- **Tailwind CSS 4**
- **stardew-valley-data** — game data queries and save file parser
- **react-icons**
- **pnpm** · **Node >= 24**

## Getting Started

```bash
git clone https://github.com/chiefpansancolt/stardew-valley-companion.git
cd stardew-valley-companion
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development

```bash
pnpm dev          # Start dev server at http://localhost:3000
pnpm build        # Production build + TypeScript check
pnpm lint         # ESLint
pnpm format       # Prettier write
pnpm format:check # Prettier check
```

Game images are copied from `stardew-valley-data` to `public/images/` automatically on `pnpm install` via `postinstall`. Run manually with:

```bash
bash scripts/copy-game-assets.sh
```

## License

MIT
