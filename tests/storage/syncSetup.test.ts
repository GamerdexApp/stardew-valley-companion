import {
  MemoryProvider,
  ProviderError,
  type SyncProvider,
} from "@gamerdexapp/gamerdex-sync";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deviceStore, SYNC_APP_ID } from "@/lib/sync/device";
import { readLocalDocument } from "@/lib/sync/document";
import {
  authEndpoint,
  createProvider,
  dataFolderOf,
  signInUrl,
} from "@/lib/sync/providerFactory";
import {
  availableProviders,
  providerOf,
  usesRepository,
} from "@/lib/sync/providers";
import { findDataRepository } from "@/lib/sync/repository";

const DEVICE_KEY = "stardew-valley-companion-sync";

const repository = (fullName: string, isPrivate: boolean) => ({
  id: 1,
  fullName,
  private: isPrivate,
});

beforeEach(() => localStorage.clear());

describe("the providers", () => {
  it("offers Google, Dropbox, OneDrive and GitHub in that order", () => {
    expect(availableProviders).toEqual([
      "google",
      "dropbox",
      "microsoft",
      "github",
    ]);
  });

  it("keeps the files in the Gamerdex folder, or in the app folder the provider names", () => {
    expect(SYNC_APP_ID).toBe("stardew-valley-companion");
    expect(dataFolderOf("google", SYNC_APP_ID)).toBe(
      "Gamerdex/stardew-valley-companion",
    );
    expect(dataFolderOf("dropbox", SYNC_APP_ID)).toBe(
      "Apps/Gamerdex/stardew-valley-companion",
    );
    expect(dataFolderOf("microsoft", SYNC_APP_ID)).toBe(
      "Apps/Gamerdex Sync/Gamerdex/stardew-valley-companion",
    );
  });

  it("uses a repository for GitHub only", () => {
    expect(usesRepository("github")).toBe(true);
    expect(usesRepository("google")).toBe(false);
  });

  it("signs in through the auth service of Gamerdex", () => {
    expect(authEndpoint("google")).toBe("https://auth.gamerdex.app/api/google");
    expect(authEndpoint("github")).toBe("https://auth.gamerdex.app/api/github");
  });

  it("builds a sign in address with the callback and the state for every provider", () => {
    for (const provider of availableProviders) {
      const url = new URL(
        signInUrl(provider, "https://example.test/sync/callback", "abc"),
      );

      expect(url.searchParams.get("state")).toBe("abc");
      expect(url.searchParams.get("redirect_uri")).toBe(
        "https://example.test/sync/callback",
      );
    }
  });

  it("treats a device with tokens and no provider as a GitHub device", () => {
    const tokens = {
      accessToken: "a",
      refreshToken: "r",
      accessExpiresAt: 0,
      refreshExpiresAt: 0,
    };

    expect(providerOf({ ...deviceStore.load(), tokens })).toBe("github");
    expect(
      providerOf({ ...deviceStore.load(), tokens, provider: "dropbox" }),
    ).toBe("dropbox");
    expect(
      providerOf({ ...deviceStore.load(), tokens: null, provider: null }),
    ).toBeNull();
  });

  it("makes a folder provider at once and a GitHub provider only once a repository is chosen", () => {
    const device = deviceStore.load();
    const token = async () => "token";

    expect(createProvider("google", device, token)).not.toBeNull();
    expect(createProvider("github", device, token)).toBeNull();
    expect(
      createProvider(
        "github",
        { ...device, repository: "me/gamerdex-data" },
        token,
      ),
    ).not.toBeNull();
  });
});

describe("the data repository", () => {
  it("is found by its name, and a private one is ready", () => {
    expect(
      findDataRepository([
        repository("me/other", true),
        repository("me/gamerdex-data", true),
      ]),
    ).toEqual({ kind: "ready", fullName: "me/gamerdex-data" });
  });

  it("is refused when it is public", () => {
    expect(findDataRepository([repository("me/gamerdex-data", false)])).toEqual(
      {
        kind: "public",
        fullName: "me/gamerdex-data",
      },
    );
  });

  it("prefers the private repository when two share the name", () => {
    expect(
      findDataRepository([
        repository("me/gamerdex-data", false),
        repository("team/gamerdex-data", true),
      ]),
    ).toEqual({ kind: "ready", fullName: "team/gamerdex-data" });
  });

  it("is missing when no repository has the name", () => {
    expect(findDataRepository([repository("me/other", true)])).toEqual({
      kind: "missing",
    });
    expect(findDataRepository([])).toEqual({ kind: "missing" });
  });
});

describe("the sync state of a device", () => {
  it("starts with a device id, a name and automatic sync on", () => {
    const device = deviceStore.load();

    expect(device.deviceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(device.deviceName).not.toBe("");
    expect(device).toMatchObject({
      provider: null,
      tokens: null,
      autoSync: true,
      syncOnReturn: true,
      waitOnMetered: false,
      activity: [],
    });
  });

  it("is saved under its own key, apart from the saved data", () => {
    deviceStore.update({ deviceName: "Laptop", autoSync: false });

    const stored = JSON.parse(localStorage.getItem(DEVICE_KEY)!);
    expect(stored).toMatchObject({ deviceName: "Laptop", autoSync: false });
    expect(localStorage.getItem("stardew-valley-companion")).toBeNull();
    expect(readLocalDocument().playthroughs).toEqual([]);
  });

  it("keeps the device id when it is saved again", () => {
    const id = deviceStore.load().deviceId;
    deviceStore.update({ deviceName: "Phone" });

    expect(deviceStore.load().deviceId).toBe(id);
  });

  it("keeps the eight latest activity entries, newest first", () => {
    for (let count = 1; count <= 10; count++) {
      deviceStore.recordActivity({
        kind: "uploaded",
        provider: "google",
        count,
      });
    }

    const { activity } = deviceStore.load();
    expect(activity).toHaveLength(8);
    expect(activity[0].count).toBe(10);
    expect(activity[7].count).toBe(3);
  });

  it("tells a listener when it changes", () => {
    const listener = vi.fn();
    const stop = deviceStore.subscribe(listener);

    deviceStore.update({ deviceName: "Tablet" });
    stop();
    deviceStore.update({ deviceName: "Other" });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("starts again when the stored text is damaged", () => {
    localStorage.setItem(DEVICE_KEY, "{not json");

    expect(deviceStore.load().deviceName).not.toBe("");
  });
});

describe("a token that the provider rejects", () => {
  const rejecting = (failures: number) => {
    const cloud = new MemoryProvider();
    let remaining = failures;
    return (getToken: () => Promise<string>): SyncProvider => ({
      read: async (path) => {
        await getToken();
        if (remaining-- > 0) throw new ProviderError("auth", "Rejected.", 401);
        return cloud.read(path);
      },
      write: (path, content, version) => cloud.write(path, content, version),
      remove: (path, version) => cloud.remove(path, version),
    });
  };

  const useProvider = async (make: ReturnType<typeof rejecting>) => {
    vi.resetModules();
    vi.doMock("@/lib/sync/providerFactory", async (original) => ({
      ...(await original<typeof import("@/lib/sync/providerFactory")>()),
      createProvider: (
        _id: string,
        _device: unknown,
        getToken: () => Promise<string>,
      ) => make(getToken),
    }));
    return import("@/lib/sync/run");
  };

  const signedInDevice = () =>
    deviceStore.update({
      provider: "google",
      tokens: {
        accessToken: "old",
        refreshToken: "refresh",
        accessExpiresAt: Date.now() + 3_600_000,
        refreshExpiresAt: Date.now() + 86_400_000,
      },
    });

  const local = { playthroughs: [], activePlaythroughId: null };

  it("is renewed once and the sync runs again", async () => {
    signedInDevice();
    const fetchMock = vi.fn(async () =>
      Response.json({
        accessToken: "new",
        refreshToken: "refresh",
        expiresIn: 3600,
        refreshExpiresIn: 86_400,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { runSync } = await useProvider(rejecting(1));

    const result = await runSync(local);

    expect(result.status).toBe("synced");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("reports the first error when the second run is refused too", async () => {
    signedInDevice();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          accessToken: "new",
          refreshToken: "refresh",
          expiresIn: 3600,
          refreshExpiresIn: 86_400,
        }),
      ),
    );
    const { runSync } = await useProvider(rejecting(2));

    await expect(runSync(local)).rejects.toMatchObject({
      kind: "auth",
      status: 401,
    });
    vi.unstubAllGlobals();
  });

  it("says no storage is chosen when nothing is connected", async () => {
    const { runSync } = await import("@/lib/sync/run");

    await expect(runSync(local)).rejects.toThrow("No storage is chosen.");
  });
});
