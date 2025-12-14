import type { Did } from "@atproto/did";

export interface IIndexTargetRepository {
  findAllSubscriberDids: () => Promise<Did[]>;
  findFolloweeDids: (subscriberDid: Did) => Promise<Did[]>;
  findFollowerDid: (followUri: string) => Promise<Did | null>;
  findFolloweeDid: (followUri: string) => Promise<Did | null>;
}
