import type { Did } from "@atproto/did";
import type { Repost } from "@repo/common/domain";

import type { IRepostRepository } from "@/server/features/xrpc/application/interfaces/repost-repository.js";

export class InMemoryRepostRepository implements IRepostRepository {
  private reposts: Map<string, Repost> = new Map();

  add(repost: Repost): void {
    this.reposts.set(repost.uri.toString(), repost);
  }

  clear(): void {
    this.reposts.clear();
  }

  findRepostsByPost({
    subjectUri,
    limit,
    cursor,
  }: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }): Promise<Repost[]> {
    let reposts = Array.from(this.reposts.values()).filter(
      (r) => r.subjectUri.toString() === subjectUri,
    );

    if (cursor) {
      reposts = reposts.filter((r) => r.createdAt < cursor);
    }

    return Promise.resolve(
      reposts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit),
    );
  }

  findByUris(uris: string[]): Promise<Repost[]> {
    return Promise.resolve(
      Array.from(this.reposts.values()).filter((r) =>
        uris.includes(r.uri.toString()),
      ),
    );
  }

  findViewerReposts({
    viewerDid,
    subjectUris,
  }: {
    viewerDid: Did;
    subjectUris: string[];
  }): Promise<Repost[]> {
    return Promise.resolve(
      Array.from(this.reposts.values()).filter(
        (r) =>
          r.actorDid === viewerDid &&
          subjectUris.includes(r.subjectUri.toString()),
      ),
    );
  }
}
