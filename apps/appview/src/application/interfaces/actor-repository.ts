import type { Did } from "@atproto/did";
import type { Actor } from "@repo/common/domain";

export interface IActorRepository {
  findByDid: (did: Did) => Promise<Actor | null>;
}
