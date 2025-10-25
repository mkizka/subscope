import { describe, expect, test } from "vitest";

import { sanitizeDate } from "./data-sanitizer.js";

describe("sanitizeDate", () => {
  test.each`
    description           | input                                   | expected
    ${"Invalid Date"}     | ${new Date("invalid-date")}             | ${"1970-01-01T00:00:00.000Z"}
    ${"Unix Epoch - 1ms"} | ${new Date(-1)}                         | ${"1970-01-01T00:00:00.000Z"}
    ${"Unix Epoch"}       | ${new Date(0)}                          | ${"1970-01-01T00:00:00.000Z"}
    ${"Unix Epoch + 1ms"} | ${new Date(1)}                          | ${"1970-01-01T00:00:00.001Z"}
    ${"9999年"}           | ${new Date("9999-12-31T23:59:59.999Z")} | ${"9999-12-31T23:59:59.999Z"}
  `("$descriptionの場合、期待値を返す", ({ input, expected }) => {
    // act
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = sanitizeDate(input);

    // assert
    expect(result.toISOString()).toBe(expected);
  });

  test("10000年の場合、9999年12月31日23:59:59.999Zを返す", () => {
    // arrange
    const input = new Date("9999-01-01T00:00:00.000Z");
    input.setUTCFullYear(10000);

    // act
    const result = sanitizeDate(input);

    // assert
    expect(result.toISOString()).toBe("9999-12-31T23:59:59.999Z");
  });
});
