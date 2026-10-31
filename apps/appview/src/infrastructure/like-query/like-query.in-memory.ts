import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { LikeDto } from "../../application/dto/like-dto.js";
import type { ILikeQuery } from "../../application/interfaces/like-query.js";

export class InMemoryLikeQuery implements ILikeQuery {
  private likes: (LikeDto & { actorDid: Did })[] = [];

  add(like: LikeDto & { actorDid: Did }): void {
    this.likes.push(like);
  }

  findViewerLikes({
    viewerDid,
    subjectUris,
  }: {
    viewerDid: Did;
    subjectUris: AtUri[];
  }): Promise<LikeDto[]> {
    const uris: string[] = subjectUris.map((uri) => uri.toString());
    return Promise.resolve(
      this.likes
        .filter(
          (like) =>
            like.actorDid === viewerDid && uris.includes(like.subjectUri),
        )
        .map(({ uri, subjectUri }) => ({ uri, subjectUri })),
    );
  }
}
