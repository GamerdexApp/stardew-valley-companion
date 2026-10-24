import { bundles, search } from "stardew-valley-data";
import type { GoldBundle, ItemBundle, JojaBundle } from "stardew-valley-data";
import type { CommunityCenterRooms, GameData } from "@/types/app";
import { isItemOrGoldBundle } from "@/lib/utils/bundleHelpers";
import {
  CC_ROOMS,
  ROOM_LABELS,
  ROOM_TO_CC_KEY,
} from "@/data/constants/bundles";

export type CatalogBundle = ItemBundle | GoldBundle;
export type Route = "community-center" | "joja";
export type BundleSet = "standard" | "remix";

const catalog: CatalogBundle[] = bundles()
  .sortByRoomAndBundleGroup()
  .get()
  .filter(isItemOrGoldBundle);

const standardCatalog = catalog.filter((bundle) => !bundle.remixBundle);

export const ABANDONED_ROOM = "abandoned-joja-mart";
export const abandonedBundle: CatalogBundle = standardCatalog.find(
  (bundle) => bundle.room === ABANDONED_ROOM,
)!;

export interface Room {
  id: string;
  label: string;
  key: keyof CommunityCenterRooms;
  /** How many bundles the room holds. A remix room holds the same number. */
  slots: number;
  /** Every bundle that can sit in a slot of this room. */
  pool: CatalogBundle[];
}

export const rooms: Room[] = CC_ROOMS.map((id) => ({
  id,
  label: ROOM_LABELS[id],
  key: ROOM_TO_CC_KEY[id] as keyof CommunityCenterRooms,
  slots: standardCatalog.filter((bundle) => bundle.room === id).length,
  pool: catalog.filter((bundle) => bundle.room === id),
}));

export const STANDARD_BUNDLE_COUNT = rooms.reduce(
  (sum, room) => sum + room.slots,
  0,
);

const standardIds = new Set(
  standardCatalog
    .filter((bundle) => CC_ROOMS.includes(bundle.room))
    .map((bundle) => bundle.id),
);

const catalogById = new Map(catalog.map((bundle) => [bundle.id, bundle]));

export const allProjects: JojaBundle[] = bundles()
  .jojaBundles()
  .get() as JojaBundle[];
export const PROJECTS_COST = allProjects.reduce(
  (sum, project) => sum + project.goldCost,
  0,
);

const fallbackImages: Record<string, string> = {
  "Spring Seeds": "images/craftable/seeds/Spring Seeds.png",
  "Summer Seeds": "images/craftable/seeds/Summer Seeds.png",
  "Fall Seeds": "images/craftable/seeds/Fall Seeds.png",
  "Winter Seeds": "images/craftable/seeds/Winter Seeds.png",
  "Large Egg (Brown)": "images/animals/produce/Large Brown Egg.png",
};

export const itemImage = (name: string): string | null =>
  fallbackImages[name] ??
  search(name).find((result) => result.name === name)?.image ??
  null;

export const isGoldBundle = (bundle: CatalogBundle): bundle is GoldBundle =>
  bundle.type === "gold";

/** How many entries the save keeps for a bundle: one per item, or one for a gold bundle. */
export const entryCount = (bundle: CatalogBundle): number =>
  isGoldBundle(bundle) ? 1 : bundle.items.length;

export const itemsNeeded = (bundle: CatalogBundle): number =>
  isGoldBundle(bundle) ? 1 : bundle.itemsRequired;

export const routeOf = (data: GameData): Route =>
  data.joja.isMember ? "joja" : "community-center";

/**
 * Remix has no saved field. The set is remix when the saved bundles of the six rooms are not the
 * standard 30. On the Community Center route an empty set is remix with empty slots.
 */
export const bundleSetOf = (data: GameData): BundleSet => {
  const saved = Object.keys(data.bundles).filter((id) =>
    CC_ROOMS.includes(catalogById.get(id)?.room ?? ""),
  );
  if (saved.length === 0) return data.joja.isMember ? "standard" : "remix";
  return saved.length === standardIds.size &&
    saved.every((id) => standardIds.has(id))
    ? "standard"
    : "remix";
};

/** A standard room lists its standard bundles. A remix room lists the bundles that are saved. */
export const bundlesIn = (data: GameData, room: Room): CatalogBundle[] =>
  bundleSetOf(data) === "standard"
    ? room.pool.filter((bundle) => standardIds.has(bundle.id))
    : room.pool.filter((bundle) => data.bundles[bundle.id] !== undefined);

const roomFlag = (data: GameData, room: Room): boolean =>
  data.communityCenter.rooms[room.key];

/** A finished Community Center no longer tracks items, so every bundle reads as complete. */
const bundlesLocked = (data: GameData, room: Room): boolean =>
  data.communityCenter.completed || roomFlag(data, room);

export const isRoomLocked = bundlesLocked;

export const handedIn = (data: GameData, bundle: CatalogBundle): number =>
  Object.values(data.bundles[bundle.id] ?? {}).filter(Boolean).length;

export const isItemHandedIn = (
  data: GameData,
  bundle: CatalogBundle,
  index: number,
): boolean => Boolean(data.bundles[bundle.id]?.[String(index)]);

export const isBundleComplete = (
  data: GameData,
  bundle: CatalogBundle,
): boolean => {
  const room = rooms.find((item) => item.id === bundle.room);
  if (room && bundlesLocked(data, room)) return true;
  return handedIn(data, bundle) >= itemsNeeded(bundle);
};

export interface RoomProgress {
  room: Room;
  done: number;
  total: number;
  flag: boolean;
}

export const roomProgress = (data: GameData, room: Room): RoomProgress => ({
  room,
  flag: roomFlag(data, room),
  total: room.slots,
  done: bundlesLocked(data, room)
    ? room.slots
    : bundlesIn(data, room).filter((bundle) => isBundleComplete(data, bundle))
        .length,
});

export interface CommunityCenterSummary {
  unlocked: boolean;
  bundlesActive: boolean;
  roomsDone: number;
  roomsTotal: number;
  bundlesDone: number;
  bundlesTotal: number;
  completed: boolean;
  ceremony: boolean;
  jojaAbandoned: boolean;
}

export const communityCenterSummary = (
  data: GameData,
): CommunityCenterSummary => {
  const progress = rooms.map((room) => roomProgress(data, room));
  const {
    unlocked,
    bundlesActive,
    completed,
    ceremonyAttended,
    jojaAbandoned,
  } = data.communityCenter;
  return {
    unlocked,
    bundlesActive,
    roomsDone: progress.filter((item) => item.flag).length,
    roomsTotal: rooms.length,
    bundlesDone: progress.reduce((sum, item) => sum + item.done, 0),
    bundlesTotal: STANDARD_BUNDLE_COUNT,
    completed,
    ceremony: ceremonyAttended,
    jojaAbandoned,
  };
};

const withBundle = (
  data: GameData,
  bundle: CatalogBundle,
  flags: Record<string, boolean>,
) => ({
  ...data.bundles,
  [bundle.id]: flags,
});

const flagsFor = (
  bundle: CatalogBundle,
  value: boolean,
): Record<string, boolean> =>
  Object.fromEntries(
    Array.from({ length: entryCount(bundle) }, (_, index) => [
      String(index),
      value,
    ]),
  );

/** The completed flag follows the six room flags, and a room flag follows its bundles. */
const syncRooms = (data: GameData, room?: Room): GameData => {
  const fixed = room
    ? {
        ...data,
        communityCenter: {
          ...data.communityCenter,
          rooms: {
            ...data.communityCenter.rooms,
            [room.key]:
              bundlesIn(data, room).length >= room.slots &&
              bundlesIn(data, room).every(
                (bundle) => handedIn(data, bundle) >= itemsNeeded(bundle),
              ),
          },
        },
      }
    : data;
  return {
    ...fixed,
    communityCenter: {
      ...fixed.communityCenter,
      completed: rooms.every((item) => fixed.communityCenter.rooms[item.key]),
    },
  };
};

export const setItemHandedIn = (
  data: GameData,
  bundle: CatalogBundle,
  index: number,
  done: boolean,
): GameData => {
  const room = rooms.find((item) => item.id === bundle.room);
  if (room && bundlesLocked(data, room)) return data;
  const flags = {
    ...flagsFor(bundle, false),
    ...data.bundles[bundle.id],
    [String(index)]: done,
  };
  const next = { ...data, bundles: withBundle(data, bundle, flags) };
  return room ? syncRooms(next, room) : next;
};

/** The All and Clear buttons of a bundle card. */
export const setAllItems = (
  data: GameData,
  bundle: CatalogBundle,
  done: boolean,
): GameData => {
  const room = rooms.find((item) => item.id === bundle.room);
  if (room && bundlesLocked(data, room)) return data;
  const next = {
    ...data,
    bundles: withBundle(data, bundle, flagsFor(bundle, done)),
  };
  return room ? syncRooms(next, room) : next;
};

export const setRoomComplete = (
  data: GameData,
  room: Room,
  complete: boolean,
): GameData =>
  syncRooms({
    ...data,
    communityCenter: {
      ...data.communityCenter,
      rooms: { ...data.communityCenter.rooms, [room.key]: complete },
    },
  });

export const setCeremony = (data: GameData, attended: boolean): GameData => ({
  ...data,
  communityCenter: { ...data.communityCenter, ceremonyAttended: attended },
});

export const setJojaAbandoned = (
  data: GameData,
  unlocked: boolean,
): GameData => ({
  ...data,
  communityCenter: { ...data.communityCenter, jojaAbandoned: unlocked },
});

const standardBundlesData = (data: GameData): GameData["bundles"] => ({
  ...Object.fromEntries(
    Object.entries(data.bundles).filter(
      ([id]) =>
        !catalogById.has(id) || catalogById.get(id)!.room === ABANDONED_ROOM,
    ),
  ),
  ...Object.fromEntries(
    [...standardIds].map((id) => [
      id,
      data.bundles[id] ?? flagsFor(catalogById.get(id)!, false),
    ]),
  ),
});

/**
 * The route is the Joja membership. A Community Center route turns the bundles on and fills the
 * standard set when no bundle is saved. A Joja route keeps the saved bundles, so the player can
 * go back.
 */
export const chooseRoute = (data: GameData, route: Route): GameData => {
  const useCenter = route === "community-center";
  const hasBundles = rooms.some((room) =>
    room.pool.some((bundle) => data.bundles[bundle.id] !== undefined),
  );
  return {
    ...data,
    bundles:
      useCenter && !hasBundles ? standardBundlesData(data) : data.bundles,
    joja: { ...data.joja, isMember: !useCenter },
    communityCenter: {
      ...data.communityCenter,
      unlocked: useCenter,
      bundlesActive: useCenter,
    },
  };
};

const noRoomsComplete: CommunityCenterRooms = {
  boilerRoom: false,
  craftsRoom: false,
  pantry: false,
  fishTank: false,
  vault: false,
  bulletin: false,
};

/** Changing the set changes the bundles, so the progress of the old set does not carry over. */
export const chooseBundleSet = (data: GameData, set: BundleSet): GameData => {
  const kept = Object.fromEntries(
    Object.entries(data.bundles).filter(
      ([id]) => catalogById.get(id)?.room === ABANDONED_ROOM,
    ),
  );
  return {
    ...data,
    bundles:
      set === "standard"
        ? standardBundlesData({ ...data, bundles: kept })
        : kept,
    communityCenter: {
      ...data.communityCenter,
      rooms: noRoomsComplete,
      completed: false,
    },
  };
};

/** Puts a bundle in a slot. A bundle that sat in the slot before leaves it. */
export const setSlotBundle = (
  data: GameData,
  room: Room,
  replaces: CatalogBundle | null,
  bundle: CatalogBundle,
): GameData => {
  const others = { ...data.bundles };
  if (replaces) delete others[replaces.id];
  return syncRooms(
    { ...data, bundles: { ...others, [bundle.id]: flagsFor(bundle, false) } },
    room,
  );
};

export const clearSlot = (
  data: GameData,
  room: Room,
  bundle: CatalogBundle,
): GameData => {
  const { [bundle.id]: _removed, ...others } = data.bundles;
  return syncRooms({ ...data, bundles: others }, room);
};

/**
 * A save keys each project by the Community Center room it replaces: the Greenhouse is the
 * Pantry, the Bridge the Crafts Room, Panning the Fish Tank, Minecarts the Boiler Room and the
 * Bus the Vault. A playthrough made with the old app keyed them by the id of the project.
 */
const saveKeys: Record<string, string> = {
  Greenhouse: "jojaPantry",
  Bridge: "jojaCraftsRoom",
  Panning: "jojaFishTank",
  Minecarts: "jojaBoilerRoom",
  Bus: "jojaVault",
};

export const isProjectPurchased = (
  data: GameData,
  project: JojaBundle,
): boolean =>
  Boolean(
    data.joja.developments[saveKeys[project.name]] ||
    data.joja.developments[project.id],
  );

const withPurchase = (
  developments: GameData["joja"]["developments"],
  project: JojaBundle,
  purchased: boolean,
) => {
  const { [project.id]: _legacy, ...others } = developments;
  return { ...others, [saveKeys[project.name]]: purchased };
};

export interface JojaSummary {
  purchased: number;
  total: number;
  invested: number;
  remaining: number;
  allDeveloped: boolean;
}

export const jojaSummary = (data: GameData): JojaSummary => {
  const bought = allProjects.filter((project) =>
    isProjectPurchased(data, project),
  );
  const invested = bought.reduce((sum, project) => sum + project.goldCost, 0);
  return {
    purchased: bought.length,
    total: allProjects.length,
    invested,
    remaining: PROJECTS_COST - invested,
    allDeveloped: bought.length === allProjects.length,
  };
};

/** The All developed flag is on exactly when all five projects are purchased. */
const syncDeveloped = (data: GameData): GameData => ({
  ...data,
  joja: { ...data.joja, completed: jojaSummary(data).allDeveloped },
});

export const setProjectPurchased = (
  data: GameData,
  project: JojaBundle,
  purchased: boolean,
): GameData =>
  syncDeveloped({
    ...data,
    joja: {
      ...data.joja,
      developments: withPurchase(data.joja.developments, project, purchased),
    },
  });

export const setAllDeveloped = (data: GameData, developed: boolean): GameData =>
  syncDeveloped({
    ...data,
    joja: {
      ...data.joja,
      developments: allProjects.reduce(
        (developments, project) =>
          withPurchase(developments, project, developed),
        data.joja.developments,
      ),
    },
  });

export type { JojaBundle };
