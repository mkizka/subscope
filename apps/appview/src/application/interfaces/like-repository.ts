import type { Did } from "@atproto/did";
import type { Like } from "@repo/common/domain";

export interface ILikeRepository {
  findMany: (params: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }) => Promise<Like[]>;

  findLikesByActor: (params: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }) => Promise<Like[]>;
}
