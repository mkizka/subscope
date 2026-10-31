import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { RepostDto } from "../dto/repost-dto.js";

export interface IRepostQuery {
  findViewerReposts: (params: {
    viewerDid: Did;
    subjectUris: AtUri[];
  }) => Promise<RepostDto[]>;
}
