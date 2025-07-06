import type { AtUri } from "@atproto/syntax";
import type { SearchPost } from "@repo/common/domain";
import type { MeilisearchClient } from "@repo/common/infrastructure";
import { createHash } from "crypto";

import type { ISearchPostRepository } from "../application/interfaces/search-post-repository.js";

export class SearchPostRepository implements ISearchPostRepository {
  private readonly indexName = "posts";

  constructor(private meilisearch: MeilisearchClient) {}
  static readonly inject = ["meilisearch"] as const;

  private getDocumentId(uri: AtUri): string {
    // AtUriの文字の一部がMeilisearchのドキュメントIDとして使用できないため、SHA256でハッシュ化
    return createHash("sha256").update(uri.toString(), "utf-8").digest("hex");
  }

  async upsert(searchPost: SearchPost): Promise<void> {
    const index = this.meilisearch.index(this.indexName);
    await index.addDocuments([
      {
        id: this.getDocumentId(searchPost.uri),
        uri: searchPost.uri.toString(),
        text: searchPost.text,
      },
    ]);
  }

  async delete(searchPost: SearchPost): Promise<void> {
    const index = this.meilisearch.index(this.indexName);
    await index.deleteDocument(this.getDocumentId(searchPost.uri));
  }
}
