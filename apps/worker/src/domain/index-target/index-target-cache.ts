import type { Did } from "@atproto/did";

export interface IIndexTargetCache {
  addSubscriber: (did: Did) => Promise<void>;
  removeSubscriber: (did: Did) => Promise<void>;
  addTrackedActor: (did: Did) => Promise<void>;
  removeTrackedActor: (did: Did) => Promise<void>;
  bulkAddSubscribers: (dids: Did[]) => Promise<void>;
  bulkAddTrackedActors: (dids: Did[]) => Promise<void>;
  clear: () => Promise<void>;
}
