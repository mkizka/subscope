import type { Did } from "@atproto/did";

export interface ITrackedActorRepository {
  updateCache: () => Promise<void>;
  isTrackedActor: (actorDid: Did) => Promise<boolean>;
  hasTrackedActor: (actorDids: Did[]) => Promise<boolean>;
}
