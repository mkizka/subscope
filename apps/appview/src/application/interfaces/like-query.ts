import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { LikeDto } from "../dto/like-dto.js";

export interface ILikeQuery {
  findViewerLikes: (params: {
    viewerDid: Did;
    subjectUris: AtUri[];
  }) => Promise<LikeDto[]>;
}
