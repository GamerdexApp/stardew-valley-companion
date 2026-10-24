# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-10-24

### Added

- A new interface built with a sidebar, a playthrough switcher and one page per game area:
  Overview, Farm, Villagers, Town, Calendar, Collections, Gear, Items needed, Mines and monsters,
  Quests, Community Center, Grandpa's evaluation, Perfection, Playthroughs and Settings.
- A landing page for new visitors. A visitor with a saved playthrough goes straight to the
  Overview.
- Every change saves at once, and a toast offers Undo. The Save button is gone.
- Optional cloud sync through Google Drive, Dropbox, OneDrive or a GitHub repository, with a merge
  that keeps the higher progress when two devices change the same playthrough. The synced file has
  the same format as the backup file.
- Settings for the theme (light, dark or system), backup and import, and the platform of each
  playthrough. Choosing between the Community Center and Joja moved to Settings, and the sidebar
  follows the choice.
- Search, filters and tabs that stay in the address, so a reload or a shared link opens the same
  view.
- The farm icon of each playthrough shows in the playthrough switcher.
- Privacy policy and Terms of service links in the footer.

### Changed

- Saved data keeps its shape. The storage key, the playthrough fields and the backup file are
  unchanged, so existing playthroughs and old backups work as before.
- Old addresses such as `/dashboard` and `/playthrough/list` redirect to the matching new page.
- Pages load faster. Long lists load their pictures as you scroll, the location pictures on the
  Town page are small copies, and a visitor who never uses sync does not load the sync code.
- The interface no longer uses Flowbite. It uses Tailwind CSS with the app's own components, with
  keyboard focus rings, labelled controls and a layout that works down to 320 px wide.

### Removed

- The Vercel analytics script. The app has no analytics code, as the privacy policy says.

## [1.1.0] - 2026-04-10

### Added

- Better SEO support
- Added a Footer
- Discord Server Link

### Chore

- Bump Dependencies

## [1.0.1] - 2026-04-05

### Fix

- Fix fishingRod parser for old version files.

## [1.0.0] - 2026-04-05

### Added

#### Playthrough Management

- Create playthroughs manually (build wizard) or by uploading a PC save file
- Multi-step create wizard: character info → bundle selection → review
- Community Center and Joja bundle modes (standard and remix)
- Edit playthrough modal with per-section editing
- Switch between multiple playthroughs from the sidebar
- Full import / export / reset in settings

#### Farm

- Character page — skills (Farming, Mining, Foraging, Fishing, Combat), professions, mastery levels, tools, fishing rods, backpacks, and pet tracking
- Buildings page — add/remove farm buildings and track animal counts per building
- Animals page — track animal friendship and produce
- Ginger Island page — golden walnut count, parrot upgrades, and island progress

#### Collections

- Collections overview with aggregate shipped/donated/caught statistics
- Crops — shipped status, seasons, sell prices with profession bonus calculator
- Forageables — all forageable items with season filters
- Animal Products — eggs, milk, and animal-derived artisan goods
- Artisan Goods — profession-aware price calculator for all artisan products
- Fish — caught tracking with location, season, weather, and time-of-day filters; category filter
- Cooking — recipe learned and cooked status
- Crafting — recipe learned and crafted status
- Artifacts — museum donation and found-in-world tracking
- Minerals — geode minerals, gemstones, and museum donation status
- Monster Loot — drops across all monster categories
- Special Items — rarecrows, furniture, hats (with price), rings, boots, and trinkets

#### Community & Progression

- Community Center — room-by-room bundle completion with item-level tracking
- Joja Mart — Joja membership development project milestones
- Villagers — heart levels, birthdays, gift preferences, marriage eligibility, and gift tracking
- Quests — special order and story quest completion
- Grandpa's Evaluation — score tracker and candle count
- Mines & Monsters — floor progress, elevator level, and monster eradication goals
- Perfection — overall perfection percentage with per-category breakdown
- Calendar — seasonal crop, forageable, and birthday calendar view
- Items Needed — aggregated view of items still needed across active goals
- Town — town and world unlock tracking
- Gear — equipment tracking

#### Infrastructure

- localStorage persistence — all data stored locally, no backend required
- Save file parser — map PC save XML directly to tracked game state
- `stardew-valley-data` integration — game data queries for all pages
- Sidebar navigation with collapsible playthrough switcher
- Toast notifications (success, error, info, warning)
- URL state service — filter state synced to query params
- Page header component with breadcrumb and contextual actions
- Filter popovers for collection pages (shipped, season, donation, marriage, etc.)
- Navy section and white card design system with shared UI components
- CI/CD — GitHub Actions workflows for lint + build and Vercel deployment
- Dependabot — automated dependency updates with grouped PRs
