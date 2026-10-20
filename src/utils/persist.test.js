import { describe, it, expect, vi } from "vitest";
import { requestPersistentStorage } from "./persist.js";

describe("requestPersistentStorage", () => {
  it("asks the browser and reports 'granted' when it agrees", async () => {
    const storage = {
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(true),
    };
    expect(await requestPersistentStorage(storage)).toBe("granted");
    expect(storage.persist).toHaveBeenCalledTimes(1);
  });

  it("reports 'denied' when the browser says no", async () => {
    const storage = {
      persisted: async () => false,
      persist: async () => false,
    };
    expect(await requestPersistentStorage(storage)).toBe("denied");
  });

  it("doesn't ask again when storage is already persistent", async () => {
    const storage = {
      persisted: async () => true,
      persist: vi.fn(),
    };
    expect(await requestPersistentStorage(storage)).toBe("already");
    expect(storage.persist).not.toHaveBeenCalled();
  });

  it("still works in a browser that has persist() but not persisted()", async () => {
    const storage = { persist: async () => true };
    expect(await requestPersistentStorage(storage)).toBe("granted");
  });

  it("reports 'unsupported' when the API is missing", async () => {
    expect(await requestPersistentStorage(undefined)).toBe("unsupported");
    expect(await requestPersistentStorage(null)).toBe("unsupported");
    expect(await requestPersistentStorage({})).toBe("unsupported");
  });

  it("reports 'error' instead of throwing if the browser call fails", async () => {
    const storage = {
      persisted: async () => {
        throw new Error("blocked");
      },
      persist: async () => true,
    };
    expect(await requestPersistentStorage(storage)).toBe("error");
  });
});
