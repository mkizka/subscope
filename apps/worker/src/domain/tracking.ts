import { asDid, type Did } from "@atproto/did";

export type TrackingParams = {
  did: string;
  trackedAt: Date;
};

export class Tracking {
  readonly did: Did;
  readonly trackedAt: Date;

  private constructor(params: TrackingParams) {
    this.did = asDid(params.did);
    this.trackedAt = params.trackedAt;
  }

  static create(did: string): Tracking {
    return new Tracking({ did, trackedAt: new Date() });
  }

  static reconstruct(params: TrackingParams): Tracking {
    return new Tracking(params);
  }
}
