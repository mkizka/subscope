import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { RepostDto } from "../../dto/repost-dto.js";

export interface IRepostQuery {
  findByUris: (uris: AtUri[]) => Promise<RepostDto[]>;

  findViewerReposts: (params: {
    viewerDid: Did;
    subjectUris: AtUri[];
  }) => Promise<RepostDto[]>;

  findBySubject: (params: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }) => Promise<RepostDto[]>;
}
