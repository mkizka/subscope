import type { IDidResolver, IMetricReporter } from "@repo/common/domain";
import { DidResolutionError } from "@repo/common/domain";
import { schema } from "@repo/db";
import { testSetup } from "@repo/test-utils";
import { eq, or } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { ImageBlob } from "../domain/image-blob.js";
import { ImageProxyRequest } from "../domain/image-proxy-request.js";
import { CacheMetadataRepository } from "../infrastructure/cache-metadata-repository.js";
import { ImageProxyUseCase } from "./image-proxy-use-case.js";
import type { IBlobFetcher } from "./interfaces/blob-fetcher.js";
import { BlobFetchFailedError } from "./interfaces/blob-fetcher.js";
import type { IImageCacheStorage } from "./interfaces/image-cache-storage.js";
import type { IImageResizer } from "./interfaces/image-resizer.js";
import { FetchBlobService } from "./services/fetch-blob-service.js";
import { ImageCacheService } from "./services/image-cache-service.js";

describe("ImageProxyUseCase", () => {
  const mockDidResolver = mock<IDidResolver>();
  const mockBlobFetcher = mock<IBlobFetcher>();
  const mockImageCacheStorage = mock<IImageCacheStorage>();
  const mockImageResizer = mock<IImageResizer>();
  const mockMetricReporter = mock<IMetricReporter>();

  const { testInjector, ctx } = testSetup;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const imageProxyUseCase = testInjector
    .provideValue("didResolver", mockDidResolver)
    .provideValue("blobFetcher", mockBlobFetcher)
    .provideValue("imageCacheStorage", mockImageCacheStorage)
    .provideValue("imageResizer", mockImageResizer)
    .provideValue("metricReporter", mockMetricReporter)
    .provideClass("cacheMetadataRepository", CacheMetadataRepository)
    .provideClass("fetchBlobService", FetchBlobService)
    .provideClass("imageCacheService", ImageCacheService)
    .injectClass(ImageProxyUseCase);

  test("キャッシュがヒットした場合、キャッシュされた画像を返してヒットメトリクスを記録する", async () => {
    // arrange
    const cachedData = new Uint8Array([1, 2, 3]);

    await ctx.db.insert(schema.imageBlobCache).values({
      cacheKey: "avatar/did:plc:example123/bafkreiabc123",
      expiredAt: new Date("2024-01-08T00:00:00.000Z"), // 成功キャッシュは1週間後
    });

    mockImageCacheStorage.read.mockResolvedValueOnce(cachedData);

    // act
    const result = await imageProxyUseCase.execute(
      ImageProxyRequest.fromParams({
        did: "did:plc:example123",
        cid: "bafkreiabc123",
        type: "avatar",
      }),
    );

    // assert
    expect(result).toEqual(ImageBlob.jpeg(cachedData));
    expect(mockImageCacheStorage.read).toHaveBeenCalledWith(
      "cache/avatar/did:plc:example123/bafkreiabc123.jpg",
    );
    expect(mockMetricReporter.increment).toHaveBeenCalledWith(
      "blob_proxy_cache_hit_total",
    );
    expect(mockDidResolver.resolve).not.toHaveBeenCalled();
    expect(mockBlobFetcher.fetchBlob).not.toHaveBeenCalled();
    expect(mockImageResizer.resize).not.toHaveBeenCalled();
    expect(mockImageCacheStorage.save).not.toHaveBeenCalled();
  });

  test("キャッシュがミスした場合、画像を取得・リサイズしてキャッシュに保存してミスメトリクスを記録する", async () => {
    // arrange
    const originalBlob = ImageBlob.jpeg(new Uint8Array([1, 2, 3, 4, 5]));
    const resizedBlob = ImageBlob.jpeg(new Uint8Array([1, 2, 3]));

    mockDidResolver.resolve.mockResolvedValueOnce({
      pds: new URL("https://example.pds.com"),
      signingKey: "test-signing-key",
      handle: "test.handle" as const,
    });
    mockBlobFetcher.fetchBlob.mockResolvedValueOnce(originalBlob);
    mockImageResizer.resize.mockResolvedValueOnce(resizedBlob);
    mockImageCacheStorage.save.mockResolvedValueOnce();

    // act
    const result = await imageProxyUseCase.execute(
      ImageProxyRequest.fromParams({
        did: "did:plc:example123",
        cid: "bafkreiabc456",
        type: "feed_thumbnail",
      }),
    );

    // assert
    expect(result).toBe(resizedBlob);
    expect(mockMetricReporter.increment).toHaveBeenCalledWith(
      "blob_proxy_cache_miss_total",
    );
    expect(mockDidResolver.resolve).toHaveBeenCalledWith("did:plc:example123");
    expect(mockBlobFetcher.fetchBlob).toHaveBeenCalledWith({
      pds: new URL("https://example.pds.com"),
      did: "did:plc:example123",
      cid: "bafkreiabc456",
    });
    expect(mockImageResizer.resize).toHaveBeenCalledWith({
      blob: originalBlob,
      preset: expect.objectContaining({
        type: "feed_thumbnail",
      }),
    });

    const savedCache = await ctx.db
      .select()
      .from(schema.imageBlobCache)
      .where(
        eq(
          schema.imageBlobCache.cacheKey,
          "feed_thumbnail/did:plc:example123/bafkreiabc456",
        ),
      );
    expect(savedCache).toHaveLength(1);
    expect(savedCache[0]).toMatchObject({
      cacheKey: "feed_thumbnail/did:plc:example123/bafkreiabc456",
      expiredAt: new Date("2024-01-08T00:00:00.000Z"), // 成功キャッシュは1週間後
    });

    expect(mockImageCacheStorage.save).toHaveBeenCalledWith(
      "cache/feed_thumbnail/did:plc:example123/bafkreiabc456.jpg",
      resizedBlob.data,
    );
  });

  test("異なるプリセットタイプで同じ画像を要求した場合、異なるキャッシュキーを使用する", async () => {
    // arrange
    mockDidResolver.resolve.mockResolvedValue({
      pds: new URL("https://example.pds.com"),
      signingKey: "test-signing-key",
      handle: "test.handle" as const,
    });
    mockBlobFetcher.fetchBlob.mockResolvedValue(
      ImageBlob.jpeg(new Uint8Array([1, 2, 3])),
    );
    mockImageResizer.resize.mockResolvedValue(
      ImageBlob.jpeg(new Uint8Array([1, 2])),
    );
    mockImageCacheStorage.save.mockResolvedValue();

    // act
    await imageProxyUseCase.execute(
      ImageProxyRequest.fromParams({
        did: "did:plc:example789",
        cid: "bafkreidef789",
        type: "avatar",
      }),
    );
    await imageProxyUseCase.execute(
      ImageProxyRequest.fromParams({
        did: "did:plc:example789",
        cid: "bafkreidef789",
        type: "avatar_thumbnail",
      }),
    );

    // assert
    const savedCaches = await ctx.db
      .select()
      .from(schema.imageBlobCache)
      .where(
        or(
          eq(
            schema.imageBlobCache.cacheKey,
            "avatar/did:plc:example789/bafkreidef789",
          ),
          eq(
            schema.imageBlobCache.cacheKey,
            "avatar_thumbnail/did:plc:example789/bafkreidef789",
          ),
        ),
      );
    expect(savedCaches).toHaveLength(2);
    expect(savedCaches).toMatchObject([
      {
        cacheKey: "avatar/did:plc:example789/bafkreidef789",
        expiredAt: new Date("2024-01-08T00:00:00.000Z"), // 成功キャッシュは1週間後
      },
      {
        cacheKey: "avatar_thumbnail/did:plc:example789/bafkreidef789",
        expiredAt: new Date("2024-01-08T00:00:00.000Z"), // 成功キャッシュは1週間後
      },
    ]);

    expect(mockImageCacheStorage.save).toHaveBeenCalledTimes(2);
  });

  test("画像取得サービスがエラーをスローした場合、エラーがそのまま伝播する", async () => {
    // arrange
    mockDidResolver.resolve.mockResolvedValueOnce({
      pds: new URL("https://example.pds.com"),
      signingKey: "test-signing-key",
      handle: "test.handle" as const,
    });
    mockBlobFetcher.fetchBlob.mockRejectedValueOnce(
      new Error("Failed to fetch blob"),
    );

    // act & assert
    await expect(
      imageProxyUseCase.execute(
        ImageProxyRequest.fromParams({
          did: "did:plc:example999",
          cid: "bafkreiabc999",
          type: "banner",
        }),
      ),
    ).rejects.toThrow("Failed to fetch blob");
    expect(mockMetricReporter.increment).toHaveBeenCalledWith(
      "blob_proxy_cache_miss_total",
    );
    expect(mockImageResizer.resize).not.toHaveBeenCalled();
    expect(mockImageCacheStorage.save).not.toHaveBeenCalled();
  });

  test("画像リサイズサービスがエラーをスローした場合、エラーがそのまま伝播する", async () => {
    // arrange
    const originalBlob = ImageBlob.jpeg(new Uint8Array([1, 2, 3]));

    mockDidResolver.resolve.mockResolvedValueOnce({
      pds: new URL("https://example.pds.com"),
      signingKey: "test-signing-key",
      handle: "test.handle" as const,
    });
    mockBlobFetcher.fetchBlob.mockResolvedValueOnce(originalBlob);
    mockImageResizer.resize.mockRejectedValueOnce(
      new Error("Failed to resize image"),
    );

    // act & assert
    await expect(
      imageProxyUseCase.execute(
        ImageProxyRequest.fromParams({
          did: "did:plc:example888",
          cid: "bafkreiabc888",
          type: "feed_fullsize",
        }),
      ),
    ).rejects.toThrow("Failed to resize image");
    expect(mockImageCacheStorage.save).not.toHaveBeenCalled();
  });

  test("キャッシュ保存がエラーになった場合、エラーがそのまま伝播する", async () => {
    // arrange
    const originalBlob = ImageBlob.jpeg(new Uint8Array([1, 2, 3, 4, 5]));
    const resizedBlob = ImageBlob.jpeg(new Uint8Array([1, 2, 3]));

    mockDidResolver.resolve.mockResolvedValueOnce({
      pds: new URL("https://example.pds.com"),
      signingKey: "test-signing-key",
      handle: "test.handle" as const,
    });
    mockBlobFetcher.fetchBlob.mockResolvedValueOnce(originalBlob);
    mockImageResizer.resize.mockResolvedValueOnce(resizedBlob);
    mockImageCacheStorage.save.mockRejectedValueOnce(
      new Error("Cache write failed"),
    );

    // act & assert
    await expect(
      imageProxyUseCase.execute(
        ImageProxyRequest.fromParams({
          did: "did:plc:example777",
          cid: "bafkreiabc777",
          type: "avatar",
        }),
      ),
    ).rejects.toThrow("Cache write failed");

    const savedCache = await ctx.db
      .select()
      .from(schema.imageBlobCache)
      .where(
        eq(
          schema.imageBlobCache.cacheKey,
          "avatar/did:plc:example777/bafkreiabc777",
        ),
      );
    expect(savedCache).toHaveLength(1);
    expect(savedCache[0]).toMatchObject({
      cacheKey: "avatar/did:plc:example777/bafkreiabc777",
      expiredAt: new Date("2024-01-08T00:00:00.000Z"), // 成功キャッシュは1週間後
    });

    expect(mockImageCacheStorage.save).toHaveBeenCalled();
  });

  test("ネガティブキャッシュがヒットした場合、nullを返してヒットメトリクスを記録する", async () => {
    // arrange
    await ctx.db.insert(schema.imageBlobCache).values({
      cacheKey: "avatar/did:plc:example555/bafkreiabc555",
      expiredAt: new Date("2024-01-01T00:05:00.000Z"), // 失敗キャッシュは5分後
      status: "failed",
    });

    // act
    const result = await imageProxyUseCase.execute(
      ImageProxyRequest.fromParams({
        did: "did:plc:example555",
        cid: "bafkreiabc555",
        type: "avatar",
      }),
    );

    // assert
    expect(result).toBeNull();
    expect(mockMetricReporter.increment).toHaveBeenCalledWith(
      "blob_proxy_cache_hit_total",
    );
    expect(mockImageCacheStorage.read).not.toHaveBeenCalled();
    expect(mockDidResolver.resolve).not.toHaveBeenCalled();
    expect(mockBlobFetcher.fetchBlob).not.toHaveBeenCalled();
    expect(mockImageResizer.resize).not.toHaveBeenCalled();
    expect(mockImageCacheStorage.save).not.toHaveBeenCalled();
  });

  test("BlobFetchFailedErrorが発生した場合、ネガティブキャッシュを保存してnullを返す", async () => {
    // arrange
    mockDidResolver.resolve.mockResolvedValueOnce({
      pds: new URL("https://example.pds.com"),
      signingKey: "test-signing-key",
      handle: "test.handle" as const,
    });
    mockBlobFetcher.fetchBlob.mockRejectedValueOnce(
      new BlobFetchFailedError("NOT_FOUND"),
    );

    // act
    const result = await imageProxyUseCase.execute(
      ImageProxyRequest.fromParams({
        did: "did:plc:example999",
        cid: "bafkreiabc999",
        type: "banner",
      }),
    );

    // assert
    expect(result).toBeNull();
    expect(mockMetricReporter.increment).toHaveBeenCalledWith(
      "blob_proxy_cache_miss_total",
    );
    expect(mockMetricReporter.increment).toHaveBeenCalledWith(
      "blob_proxy_error_total",
      { error: "BlobFetchFailedError" },
    );
    expect(mockImageResizer.resize).not.toHaveBeenCalled();
    expect(mockImageCacheStorage.save).not.toHaveBeenCalled();

    const savedCache = await ctx.db
      .select()
      .from(schema.imageBlobCache)
      .where(
        eq(
          schema.imageBlobCache.cacheKey,
          "banner/did:plc:example999/bafkreiabc999",
        ),
      );
    expect(savedCache).toHaveLength(1);
    expect(savedCache[0]).toMatchObject({
      cacheKey: "banner/did:plc:example999/bafkreiabc999",
      status: "failed",
      expiredAt: new Date("2024-01-01T00:05:00.000Z"), // 失敗キャッシュは5分後
    });
  });

  test("DidResolutionErrorが発生した場合、ネガティブキャッシュを保存してnullを返す", async () => {
    // arrange
    mockDidResolver.resolve.mockRejectedValueOnce(
      new DidResolutionError("DID resolution failed"),
    );

    // act
    const result = await imageProxyUseCase.execute(
      ImageProxyRequest.fromParams({
        did: "did:plc:example888",
        cid: "bafkreiabc888",
        type: "feed_fullsize",
      }),
    );

    // assert
    expect(result).toBeNull();
    expect(mockMetricReporter.increment).toHaveBeenCalledWith(
      "blob_proxy_cache_miss_total",
    );
    expect(mockMetricReporter.increment).toHaveBeenCalledWith(
      "blob_proxy_error_total",
      { error: "DidResolutionError" },
    );
    expect(mockBlobFetcher.fetchBlob).not.toHaveBeenCalled();
    expect(mockImageResizer.resize).not.toHaveBeenCalled();
    expect(mockImageCacheStorage.save).not.toHaveBeenCalled();

    const savedCache = await ctx.db
      .select()
      .from(schema.imageBlobCache)
      .where(
        eq(
          schema.imageBlobCache.cacheKey,
          "feed_fullsize/did:plc:example888/bafkreiabc888",
        ),
      );
    expect(savedCache).toHaveLength(1);
    expect(savedCache[0]).toMatchObject({
      cacheKey: "feed_fullsize/did:plc:example888/bafkreiabc888",
      status: "failed",
      expiredAt: new Date("2024-01-01T00:05:00.000Z"), // 失敗キャッシュは5分後
    });
  });
});
