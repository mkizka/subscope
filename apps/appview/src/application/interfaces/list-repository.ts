import type { Did } from "@atproto/did";
import type { List } from "@repo/common/domain";

export interface IListRepository {
  findByActor: (params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
    purposes?: string[];
  }) => Promise<List[]>;
}
