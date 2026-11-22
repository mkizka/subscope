import type { Origin, PdsOrigin } from "@repo/common/interface";

export const fetchedFrom = (origin: Origin): PdsOrigin => ({
  via: "pds",
  hop: origin.via === "tap" ? 1 : origin.hop + 1,
  live: origin.live,
});
