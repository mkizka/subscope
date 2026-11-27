import type { Did } from "@atproto/did";

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
}
