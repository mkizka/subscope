import { describe, expect, test, vi } from "vitest";

import { Batch } from "./batch.js";

describe("Batch", () => {
  test("同じティックの load をまとめて1回だけ fetch し、同じキーはキャッシュする", async () => {
    // arrange
    const fetch = vi.fn((keys: string[]) =>
      Promise.resolve(new Map(keys.map((key) => [key, key.toUpperCase()]))),
    );
    const batch = new Batch(fetch);

    // act
    const first = await Promise.all([
      batch.load("a"),
      batch.load("b"),
      batch.load("a"),
    ]);
    const second = await batch.load("a");

    // assert
    expect(first).toEqual(["A", "B", "A"]);
    expect(second).toBe("A");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(["a", "b"]);
  });

  test("fetch に無いキーは undefined になる", async () => {
    // arrange
    const batch = new Batch<string, string>(() =>
      Promise.resolve(new Map<string, string>()),
    );

    // act
    const value = await batch.load("missing");

    // assert
    expect(value).toBeUndefined();
  });
});
