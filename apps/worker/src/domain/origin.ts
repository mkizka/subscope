const MAX_FETCH_DEPTH = 2;

export class Origin {
  private readonly source: "tap" | "fetch";
  private readonly isLive: boolean;
  private readonly depth: number;

  private constructor(params: {
    source: "tap" | "fetch";
    isLive: boolean;
    depth: number;
  }) {
    this.source = params.source;
    this.isLive = params.isLive;
    this.depth = params.depth;
  }

  static live() {
    return new Origin({ source: "tap", isLive: true, depth: 0 });
  }

  static backfill() {
    return new Origin({ source: "tap", isLive: false, depth: 0 });
  }

  static fromFetchJob({ live, depth }: { live: boolean; depth: number }) {
    return new Origin({ source: "fetch", isLive: live, depth: depth + 1 });
  }

  get isPast() {
    return this.source === "tap" && !this.isLive;
  }

  get isFetched() {
    return this.source === "fetch";
  }

  get notifies() {
    return this.source === "tap" && this.isLive;
  }

  get judgesGateViolation() {
    return this.notifies;
  }

  get canFetchRelated() {
    return this.depth < MAX_FETCH_DEPTH;
  }

  get jobOptions() {
    return { live: this.isLive, depth: this.depth };
  }
}
