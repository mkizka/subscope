import type { Did } from "@atproto/did";
import type { Repost } from "@repo/common/domain";

export interface IRepostRepository {
  findRepostsByPost: (params: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }) => Promise<Repost[]>;

  findByUris: (uris: string[]) => Promise<Repost[]>;

  findViewerReposts: (params: {
    viewerDid: Did;
    subjectUris: string[];
  }) => Promise<Map<string, Repost>>;
}
