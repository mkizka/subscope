import { CacheMetadata } from "../../domain/cache-metadata.js";
import { ImageBlob } from "../../domain/image-blob.js";
import type { ICacheMetadataRepository } from "../interfaces/cache-metadata-repository.js";
import type { IImageCacheStorage } from "../interfaces/image-cache-storage.js";

export class ImageCacheService {
  static inject = ["cacheMetadataRepository", "imageCacheStorage"] as const;

  constructor(
    private cacheMetadataRepository: ICacheMetadataRepository,
    private imageCacheStorage: IImageCacheStorage,
  ) {}

  async get(cacheKey: string): Promise<CacheMetadata | null> {
    const cacheEntry = await this.cacheMetadataRepository.get(cacheKey);
    if (!cacheEntry) {
      return null;
    }

    if (cacheEntry.status === "failed") {
      // ネガティブキャッシュの場合はimageBlob=nullで返す
      return new CacheMetadata({
        cacheKey: cacheEntry.cacheKey,
        status: "failed",
        imageBlob: null,
      });
    }

    const data = await this.imageCacheStorage.read(cacheEntry.getPath());
    if (!data) {
      // ファイルが存在しない場合はキャッシュエントリを削除
      await this.cacheMetadataRepository.delete(cacheKey);
      return null;
    }

    return new CacheMetadata({
      cacheKey: cacheEntry.cacheKey,
      status: "success",
      imageBlob: new ImageBlob({
        data,
        contentType: "image/jpeg",
      }),
    });
  }

  async set(cacheKey: string, blob: ImageBlob | null): Promise<void> {
    const status = blob ? "success" : "failed";
    const cacheMetadata = new CacheMetadata({
      cacheKey,
      status,
      imageBlob: blob,
    });

    await this.cacheMetadataRepository.save(cacheMetadata);

    if (blob) {
      await this.imageCacheStorage.save(cacheMetadata.getPath(), blob.data);
    }
  }
}
