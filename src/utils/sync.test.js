import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSync } from "./sync.js";

// A stand-in for BroadcastChannel: messages go to every OTHER open channel
// with the same name, which is how two open copies of the app talk.
class FakeChannel {
  static open = [];
  constructor(name) {
    this.name = name;
    this.onmessage = null;
    this.closed = false;
    FakeChannel.open.push(this);
  }
  postMessage(data) {
    for (const c of FakeChannel.open) {
      if (c !== this && !c.closed && c.name === this.name && c.onmessage) {
        c.onmessage({ data });
      }
    }
  }
  close() {
    this.closed = true;
  }
}

beforeEach(() => {
  FakeChannel.open = [];
});

describe("createSync", () => {
  it("tells the other open copies when this one changes the log", () => {
    const heardByA = vi.fn();
    const heardByB = vi.fn();
    const a = createSync(heardByA, FakeChannel);
    createSync(heardByB, FakeChannel);

    a.notify();

    expect(heardByB).toHaveBeenCalledTimes(1);
  });

  it("doesn't tell a copy about its own changes", () => {
    const heardByA = vi.fn();
    const a = createSync(heardByA, FakeChannel);
    createSync(vi.fn(), FakeChannel);

    a.notify();

    expect(heardByA).not.toHaveBeenCalled();
  });

  it("reaches every other copy, not just one", () => {
    const heard = [vi.fn(), vi.fn()];
    const a = createSync(vi.fn(), FakeChannel);
    heard.forEach((fn) => createSync(fn, FakeChannel));

    a.notify();

    heard.forEach((fn) => expect(fn).toHaveBeenCalledTimes(1));
  });

  it("stops listening after close()", () => {
    const heardByB = vi.fn();
    const a = createSync(vi.fn(), FakeChannel);
    const b = createSync(heardByB, FakeChannel);

    b.close();
    a.notify();

    expect(heardByB).not.toHaveBeenCalled();
  });

  it("does nothing, and doesn't crash, in a browser with no BroadcastChannel", () => {
    const sync = createSync(vi.fn(), null);
    expect(() => sync.notify()).not.toThrow();
    expect(() => sync.close()).not.toThrow();
  });

  it("survives a channel that throws when sending", () => {
    class Broken extends FakeChannel {
      postMessage() {
        throw new Error("closed");
      }
    }
    const sync = createSync(vi.fn(), Broken);
    expect(() => sync.notify()).not.toThrow();
  });
});
