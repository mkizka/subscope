import { describe, expect, test } from "vitest";

import { Origin } from "./origin.js";

describe("Origin", () => {
  test.each([
    {
      name: "Tapのライブ",
      origin: Origin.live(),
      expected: {
        isPast: false,
        notifies: true,
        canFetchRelated: true,
        jobOptions: { live: true, depth: 0 },
      },
    },
    {
      name: "Tapのバックフィル",
      origin: Origin.backfill(),
      expected: {
        isPast: true,
        notifies: false,
        canFetchRelated: true,
        jobOptions: { live: false, depth: 0 },
      },
    },
    {
      name: "PDSから取得(1段目)",
      origin: Origin.fromFetchJob(Origin.backfill().jobOptions),
      expected: {
        isPast: false,
        notifies: false,
        canFetchRelated: true,
        jobOptions: { live: false, depth: 1 },
      },
    },
    {
      name: "PDSから取得(2段目)",
      origin: Origin.fromFetchJob(
        Origin.fromFetchJob(Origin.live().jobOptions).jobOptions,
      ),
      expected: {
        isPast: false,
        notifies: false,
        canFetchRelated: false,
        jobOptions: { live: true, depth: 2 },
      },
    },
  ])("$nameの場合、出どころに合った扱いを返す", ({ origin, expected }) => {
    // act & assert
    expect({
      isPast: origin.isPast,
      notifies: origin.notifies,
      canFetchRelated: origin.canFetchRelated,
      jobOptions: origin.jobOptions,
    }).toEqual(expected);
  });
});
