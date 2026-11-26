const MAX_FETCH_DEPTH = 2;

export class Origin {
  private constructor(
    private readonly source: "tap" | "fetch",
    private readonly isLive: boolean,
    private readonly depth: number,
  ) {}

  static live() {
    return new Origin("tap", true, 0);
  }

  static backfill() {
    return new Origin("tap", false, 0);
  }

  static fromFetchJob({ live, depth }: { live: boolean; depth: number }) {
    return new Origin("fetch", live, depth + 1);
  }

  get isFetched() {
    return this.source === "fetch";
  }

  get isPast() {
    return this.source === "tap" && !this.isLive;
  }

  get notifies() {
    return this.source === "tap" && this.isLive;
  }

  get canFetchRelated() {
    return this.depth < MAX_FETCH_DEPTH;
  }

  get jobOptions() {
    return { live: this.isLive, depth: this.depth };
  }
}
