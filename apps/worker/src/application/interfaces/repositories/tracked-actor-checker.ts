import type { Did } from "@atproto/did";

export interface ITrackedActorChecker {
  isTrackedActor: (actorDid: Did) => Promise<boolean>;
  hasTrackedActor: (actorDids: Did[]) => Promise<boolean>;
}
