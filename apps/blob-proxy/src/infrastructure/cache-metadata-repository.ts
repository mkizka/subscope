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

    return row ? new CacheMetadata(row) : null;
  }

  async save(key: string): Promise<void> {
    await this.db
      .insert(schema.imageBlobCache)
      .values({
        cacheKey: key,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.imageBlobCache.cacheKey,
        set: {
          createdAt: new Date(),
        },
      });
  }

  async delete(key: string): Promise<void> {
    await this.db
      .delete(schema.imageBlobCache)
      .where(eq(schema.imageBlobCache.cacheKey, key));
  }

  async findExpiredEntries(expirationDate: Date): Promise<CacheMetadata[]> {
    const rows = await this.db
      .select()
      .from(schema.imageBlobCache)
      .where(lt(schema.imageBlobCache.createdAt, expirationDate));

    return rows.map((row) => new CacheMetadata(row));
  }
}
