export type Origin =
  { type: "tapLive" } | { type: "tapPast" } | { type: "pds"; hop: number };
