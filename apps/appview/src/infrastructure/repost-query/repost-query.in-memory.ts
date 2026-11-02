import type { Did } from "@atproto/did";
import type { AtUri } from "@atproto/syntax";

import type { RepostDto } from "../../application/dto/repost-dto.js";
import type { IRepostQuery } from "../../application/interfaces/repost-query.js";

export class InMemoryRepostQuery implements IRepostQuery {
  private reposts: RepostDto[] = [];

  add(repost: RepostDto): void {
    this.reposts.push(repost);
  }

  findByUris(uris: AtUri[]): Promise<RepostDto[]> {
    const targets: string[] = uris.map((uri) => uri.toString());
    return Promise.resolve(
      this.reposts.filter((repost) => targets.includes(repost.uri)),
    );
  }

  findViewerReposts({
    viewerDid,
    subjectUris,
  }: {
    viewerDid: Did;
    subjectUris: AtUri[];
  }): Promise<RepostDto[]> {
    const uris: string[] = subjectUris.map((uri) => uri.toString());
    return Promise.resolve(
      this.reposts.filter(
        (repost) =>
          repost.actorDid === viewerDid && uris.includes(repost.subjectUri),
      ),
    );
  }

  findBySubject({
    subjectUri,
    limit,
    cursor,
  }: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }): Promise<RepostDto[]> {
    return Promise.resolve(
      this.reposts
        .filter(
          (repost) =>
            repost.subjectUri === subjectUri &&
            (!cursor || repost.sortAt < cursor),
        )
        .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime())
        .slice(0, limit),
    );
  }
}
