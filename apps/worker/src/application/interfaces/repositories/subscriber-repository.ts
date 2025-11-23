import type { Did } from "@atproto/did";

export interface ISubscriberRepository {
  updateCache: () => Promise<void>;
  isSubscriber: (actorDid: Did) => Promise<boolean>;
  hasSubscriber: (actorDids: Did[]) => Promise<boolean>;
}
