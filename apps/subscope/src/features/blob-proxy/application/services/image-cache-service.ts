import { CacheMetadata } from "../../domain/cache-metadata.js";
import { ImageBlob } from "../../domain/image-blob.js";
import type { ICacheMetadataRepository } from "../interfaces/cache-metadata-repository.js";
import type { IImageCacheStorage } from "../interfaces/image-cache-storage.js";

export class ImageCacheService {
  static inject = [
    "cacheMetadataRepository",
    "imageCacheStorage",
    "blobCacheDir",
  ] as const;

  constructor(
    private cacheMetadataRepository: ICacheMetadataRepository,
    private imageCacheStorage: IImageCacheStorage,
    private blobCacheDir: string,
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
        expiredAt: cacheEntry.expiredAt,
      });
    }

    const data = await this.imageCacheStorage.read(
      cacheEntry.getPath(this.blobCacheDir),
    );
    if (!data) {
      // ファイルが存在しない場合はキャッシュエントリを削除
      await this.cacheMetadataRepository.delete(cacheKey);
      return null;
    }

    return new CacheMetadata({
      cacheKey: cacheEntry.cacheKey,
      status: "success",
      imageBlob: ImageBlob.jpeg(data),
      expiredAt: cacheEntry.expiredAt,
    });
  }

  async set(cacheMetadata: CacheMetadata): Promise<void> {
    await this.cacheMetadataRepository.save(cacheMetadata);

    if (cacheMetadata.imageBlob) {
      await this.imageCacheStorage.save(
        cacheMetadata.getPath(this.blobCacheDir),
        cacheMetadata.imageBlob.data,
      );
    }
  }

  async delete(cacheMetadata: CacheMetadata): Promise<void> {
    if (cacheMetadata.status === "success") {
      await this.imageCacheStorage.remove(
        cacheMetadata.getPath(this.blobCacheDir),
      );
    }
    await this.cacheMetadataRepository.delete(cacheMetadata.cacheKey);
  }
}
