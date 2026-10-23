import type { IconType } from "react-icons";
import {
  LuAward,
  LuCalendarDays,
  LuClipboardList,
  LuCrown,
  LuLandmark,
  LuLayoutDashboard,
  LuLibrary,
  LuPickaxe,
  LuScrollText,
  LuSettings,
  LuStore,
  LuSwords,
  LuTractor,
  LuUsers,
} from "react-icons/lu";

export const APP_NAME = "Stardew Valley Companion";

export type NavItemId =
  | "overview"
  | "farm"
  | "villagers"
  | "town"
  | "calendar"
  | "collections"
  | "gear"
  | "itemsNeeded"
  | "mines"
  | "quests"
  | "communityCenter"
  | "grandpa"
  | "perfection"
  | "settings";

export type NavGroupId = "farm" | "collect" | "progress";

export interface NavItem {
  id: NavItemId;
  label: string;
  href: string;
  icon: IconType;
}

export interface NavGroup {
  id: NavGroupId | null;
  label?: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    id: null,
    items: [
      {
        id: "overview",
        label: "Overview",
        href: "/overview",
        icon: LuLayoutDashboard,
      },
    ],
  },
  {
    id: "farm",
    label: "Your farm",
    items: [
      { id: "farm", label: "Farm", href: "/farm", icon: LuTractor },
      {
        id: "villagers",
        label: "Villagers",
        href: "/villagers",
        icon: LuUsers,
      },
      { id: "town", label: "Town", href: "/town", icon: LuStore },
      {
        id: "calendar",
        label: "Calendar",
        href: "/calendar",
        icon: LuCalendarDays,
      },
    ],
  },
  {
    id: "collect",
    label: "Collect",
    items: [
      {
        id: "collections",
        label: "Collections",
        href: "/collections",
        icon: LuLibrary,
      },
      { id: "gear", label: "Gear", href: "/gear", icon: LuSwords },
      {
        id: "itemsNeeded",
        label: "Items needed",
        href: "/items-needed",
        icon: LuClipboardList,
      },
    ],
  },
  {
    id: "progress",
    label: "Progress",
    items: [
      {
        id: "mines",
        label: "Mines and monsters",
        href: "/mines",
        icon: LuPickaxe,
      },
      { id: "quests", label: "Quests", href: "/quests", icon: LuScrollText },
      {
        id: "communityCenter",
        label: "Community Center",
        href: "/community-center",
        icon: LuLandmark,
      },
      {
        id: "grandpa",
        label: "Grandpa's evaluation",
        href: "/grandpa",
        icon: LuCrown,
      },
      {
        id: "perfection",
        label: "Perfection",
        href: "/perfection",
        icon: LuAward,
      },
    ],
  },
];

export const settingsNavItem: NavItem = {
  id: "settings",
  label: "Settings",
  href: "/settings",
  icon: LuSettings,
};

export const PLAYTHROUGHS_HREF = "/playthroughs";
export const NEW_PLAYTHROUGH_HREF = "/playthroughs/new";

export const navItems: NavItem[] = [
  ...navGroups.flatMap((group) => group.items),
  settingsNavItem,
];

const isPathWithin = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export const isNavItemActive = (item: NavItem, pathname: string) =>
  isPathWithin(pathname, item.href);

const routeTitles: Record<string, string> = {
  [PLAYTHROUGHS_HREF]: "My playthroughs",
  [NEW_PLAYTHROUGH_HREF]: "New playthrough",
};

export const getNavItem = (pathname: string) =>
  navItems.find((item) => isNavItemActive(item, pathname)) ?? null;

export const getPageTitle = (pathname: string): string =>
  routeTitles[pathname] ?? getNavItem(pathname)?.label ?? APP_NAME;
