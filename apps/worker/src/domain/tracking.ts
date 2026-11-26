import type { Did } from "@atproto/did";

const PAST_RECORD_WINDOW_MS = 24 * 60 * 60 * 1000;

export class Tracking {
  private constructor(
    readonly did: Did,
    readonly trackedAt: Date,
  ) {}

  static start(did: Did) {
    return new Tracking(did, new Date());
  }

  static reconstruct(params: { did: Did; trackedAt: Date }) {
    return new Tracking(params.did, params.trackedAt);
  }

  covers(date: Date) {
    return date.getTime() >= this.trackedAt.getTime() - PAST_RECORD_WINDOW_MS;
  }
}
