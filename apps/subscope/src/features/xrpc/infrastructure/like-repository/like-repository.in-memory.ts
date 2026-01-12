import type { Did } from "@atproto/did";
import type { Like } from "@repo/common/domain";

import type { ILikeRepository } from "../../application/interfaces/like-repository.js";

export class InMemoryLikeRepository implements ILikeRepository {
  private likes: Map<string, Like> = new Map();

  add(like: Like): void {
    this.likes.set(like.uri.toString(), like);
  }

  clear(): void {
    this.likes.clear();
  }

  findMany({
    subjectUri,
    limit,
    cursor,
  }: {
    subjectUri: string;
    limit: number;
    cursor?: Date;
  }): Promise<Like[]> {
    let likes = Array.from(this.likes.values()).filter(
      (l) => l.subjectUri.toString() === subjectUri,
    );

    if (cursor) {
      likes = likes.filter((l) => l.createdAt < cursor);
    }

    return Promise.resolve(
      likes
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit),
    );
  }

  findLikesByActor({
    actorDid,
    limit,
    cursor,
  }: {
    actorDid: Did;
    limit: number;
    cursor?: string;
  }): Promise<Like[]> {
    let likes = Array.from(this.likes.values()).filter(
      (l) => l.actorDid === actorDid,
    );

    if (cursor) {
      const cursorDate = new Date(cursor);
      likes = likes.filter((l) => l.createdAt < cursorDate);
    }

    return Promise.resolve(
      likes
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit),
    );
  }

  findViewerLikes({
    viewerDid,
    subjectUris,
  }: {
    viewerDid: Did;
    subjectUris: string[];
  }): Promise<Like[]> {
    return Promise.resolve(
      Array.from(this.likes.values()).filter(
        (l) =>
          l.actorDid === viewerDid &&
          subjectUris.includes(l.subjectUri.toString()),
      ),
    );
  }
}
