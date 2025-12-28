import type { Did } from "@atproto/did";

export interface IIndexTargetRepository {
  isSubscriber: (did: Did) => Promise<boolean>;
  hasSubscriber: (dids: Did[]) => Promise<boolean>;

  addSubscriber: (did: Did) => Promise<void>;
  removeSubscriber: (did: Did) => Promise<void>;

  clear: () => void;
  bulkAddSubscribers: (dids: Did[]) => Promise<void>;
}
