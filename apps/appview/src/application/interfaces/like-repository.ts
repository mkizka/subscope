import type { Did } from "@atproto/did";
import type { Like } from "@repo/common/domain";

export interface ILikeRepository {
  findMany: (params: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }) => Promise<Like[]>;

  findViewerLikes: (params: {
    viewerDid: Did;
    subjectUris: string[];
  }) => Promise<Like[]>;
}
