import type { Did } from "@atproto/did";

export interface IIndexTargetRepository {
  isSubscriber: (did: Did) => Promise<boolean>;
  hasSubscriber: (dids: Did[]) => Promise<boolean>;
  isTrackedActor: (did: Did) => Promise<boolean>;
  hasTrackedActor: (dids: Did[]) => Promise<boolean>;

  addSubscriber: (did: Did) => Promise<void>;
  removeSubscriber: (did: Did) => Promise<void>;
  addTrackedActor: (did: Did) => Promise<void>;
  removeTrackedActor: (did: Did) => Promise<void>;

  clear: () => void;
  bulkAddSubscribers: (dids: Did[]) => Promise<void>;
  bulkAddTrackedActors: (dids: Did[]) => Promise<void>;
}
