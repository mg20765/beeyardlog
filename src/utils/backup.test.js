import { describe, it, expect } from "vitest";
import { readBackupFile } from "./backup.js";

// readBackupFile only calls file.text(), so a stand-in is enough.
const fileOf = (text) => ({ text: async () => text });
const backupOf = (inspections) =>
  JSON.stringify({ app: "hive-logbook", inspections });

describe("readBackupFile", () => {
  it("reads the { inspections: [...] } wrapper the app writes", async () => {
    const rows = [{ "Hive ID": "H1" }, { "Hive ID": "H2" }];
    expect(await readBackupFile(fileOf(backupOf(rows)))).toEqual(rows);
  });

  it("still accepts a bare array of rows", async () => {
    const rows = [{ "Hive ID": "H1" }];
    expect(await readBackupFile(fileOf(JSON.stringify(rows)))).toEqual(rows);
  });

  it("rejects text that isn't JSON with a friendly message", async () => {
    await expect(readBackupFile(fileOf("not json at all"))).rejects.toThrow(
      /doesn't look like a BeeYardLog backup/,
    );
  });

  it("rejects JSON null instead of crashing", async () => {
    await expect(readBackupFile(fileOf("null"))).rejects.toThrow(
      /doesn't look like a BeeYardLog backup/,
    );
  });

  it("rejects an object with no inspections list", async () => {
    await expect(readBackupFile(fileOf('{"hello":1}'))).rejects.toThrow(
      /doesn't look like a BeeYardLog backup/,
    );
  });

  it("rejects a backup containing no inspections", async () => {
    await expect(readBackupFile(fileOf(backupOf([])))).rejects.toThrow(
      /no inspections/,
    );
  });

  it("rejects the whole file if any row is not an object", async () => {
    for (const bad of [null, "H1", 42, ["H1"]]) {
      await expect(
        readBackupFile(fileOf(backupOf([{ "Hive ID": "H1" }, bad]))),
      ).rejects.toThrow(/damaged/);
    }
  });
});
