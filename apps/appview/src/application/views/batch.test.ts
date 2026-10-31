import { describe, expect, test, vi } from "vitest";

import { Batch } from "./batch.js";

describe("Batch", () => {
  test("同じティックの load をまとめて1回だけ fetch し、同じキーはキャッシュする", async () => {
    // arrange
    const fetch = vi.fn((keys: string[]) =>
      Promise.resolve(keys.map((key) => key.toUpperCase())),
    );
    const batch = Batch.one(fetch, (value) => value.toLowerCase());

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
    const batch = Batch.one<string, string>(
      () => Promise.resolve([]),
      (value) => value,
    );

    // act
    const value = await batch.load("missing");

    // assert
    expect(value).toBeUndefined();
  });

  test("many は同じキーの値を配列にまとめる", async () => {
    // arrange
    const batch = Batch.many(
      () => Promise.resolve(["a1", "b1", "a2"]),
      (value: string) => value.charAt(0),
    );

    // act
    const values = await Promise.all([batch.load("a"), batch.load("b")]);

    // assert
    expect(values).toEqual([["a1", "a2"], ["b1"]]);
  });
});
