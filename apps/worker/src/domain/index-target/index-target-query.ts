import type { Did } from "@atproto/did";

export interface IIndexTargetQuery {
  isSubscriber: (did: Did) => Promise<boolean>;
  hasSubscriber: (dids: Did[]) => Promise<boolean>;
  isTrackedActor: (did: Did) => Promise<boolean>;
  hasTrackedActor: (dids: Did[]) => Promise<boolean>;
}
