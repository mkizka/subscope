import type { DatabaseClient } from "@repo/common/domain";
import { schema } from "@repo/db";
import { eq, lt } from "drizzle-orm";

import type { ICacheMetadataRepository } from "../application/interfaces/cache-metadata-repository.js";
import { CacheMetadata } from "../domain/cache-metadata.js";

export class CacheMetadataRepository implements ICacheMetadataRepository {
  constructor(private readonly db: DatabaseClient) {}
  static inject = ["db"] as const;

  async get(key: string): Promise<CacheMetadata | null> {
    const [row] = await this.db
      .select()
      .from(schema.imageBlobCache)
      .where(eq(schema.imageBlobCache.cacheKey, key))
      .limit(1);

    return row
      ? new CacheMetadata({
          cacheKey: row.cacheKey,
          status: row.status,
          imageBlob: null,
          expiredAt: row.expiredAt,
        })
      : null;
  }

  async save(cacheMetadata: CacheMetadata): Promise<void> {
    await this.db
      .insert(schema.imageBlobCache)
      .values({
        cacheKey: cacheMetadata.cacheKey,
        expiredAt: cacheMetadata.expiredAt,
        status: cacheMetadata.status,
      })
      .onConflictDoUpdate({
        target: schema.imageBlobCache.cacheKey,
        set: {
          expiredAt: cacheMetadata.expiredAt,
          status: cacheMetadata.status,
        },
      });
  }

  async delete(key: string): Promise<void> {
    await this.db
      .delete(schema.imageBlobCache)
      .where(eq(schema.imageBlobCache.cacheKey, key));
  }

  async findExpired(): Promise<CacheMetadata[]> {
    const rows = await this.db
      .select()
      .from(schema.imageBlobCache)
      .where(lt(schema.imageBlobCache.expiredAt, new Date()));

    return rows.map(
      (row) =>
        new CacheMetadata({
          cacheKey: row.cacheKey,
          status: row.status,
          imageBlob: null,
          expiredAt: row.expiredAt,
        }),
    );
  }
}
