import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { CacheMetadata } from "../domain/cache-metadata.js";
import { ImageBlob } from "../domain/image-blob.js";
import { ImageProxyRequest } from "../domain/image-proxy-request.js";
import { testInjector } from "../test-utils.js";
import { ImageProxyUseCase } from "./image-proxy-use-case.js";

describe("ImageProxyUseCase", () => {
  const imageProxyUseCase = testInjector.injectClass(ImageProxyUseCase);

  const didResolver = testInjector.resolve("didResolver");
  const blobFetcher = testInjector.resolve("blobFetcher");
  const imageCacheStorage = testInjector.resolve("imageCacheStorage");
  const imageResizer = testInjector.resolve("imageResizer");
  const metricReporter = testInjector.resolve("metricReporter");
  const cacheMetadataRepo = testInjector.resolve("cacheMetadataRepository");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("キャッシュがヒットした場合、キャッシュされた画像を返してヒットメトリクスを記録する", async () => {
    // arrange
    const cachedData = new Uint8Array([1, 2, 3]);

    await cacheMetadataRepo.save(
      new CacheMetadata({
        cacheKey: "avatar/did:plc:example123/bafkreiabc123",
        status: "success",
        imageBlob: null,
        expiredAt: new Date("2024-01-08T00:00:00.000Z"),
      }),
    );

    imageCacheStorage.setSaveResult(
      "cache/avatar/did:plc:example123/bafkreiabc123.jpg",
      cachedData,
    );

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
    expect(metricReporter.getCounter("blob_proxy_cache_hit_total")).toEqual(1);
  });

  test("キャッシュがミスした場合、画像を取得・リサイズしてキャッシュに保存してミスメトリクスを記録する", async () => {
    // arrange
    const originalBlob = ImageBlob.jpeg(new Uint8Array([1, 2, 3, 4, 5]));
    const resizedBlob = ImageBlob.jpeg(new Uint8Array([1, 2, 3]));

    didResolver.setResolveResult("did:plc:example123", {
      pds: new URL("https://example.pds.com"),
      signingKey: "test-signing-key",
      handle: "test.handle" as const,
    });

    blobFetcher.setFetchResult(
      {
        pds: new URL("https://example.pds.com"),
        did: "did:plc:example123",
        cid: "bafkreiabc456",
      },
      originalBlob,
    );

    imageResizer.setResizeResult(
      ImageProxyRequest.fromParams({
        did: "did:plc:example123",
        cid: "bafkreiabc456",
        type: "feed_thumbnail",
      }).preset,
      resizedBlob,
    );

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
    expect(metricReporter.getCounter("blob_proxy_cache_miss_total")).toEqual(1);

    const savedCache = await cacheMetadataRepo.get(
      "feed_thumbnail/did:plc:example123/bafkreiabc456",
    );
    expect(savedCache).not.toBeNull();
    expect(savedCache).toMatchObject({
      cacheKey: "feed_thumbnail/did:plc:example123/bafkreiabc456",
      status: "success",
      expiredAt: new Date("2024-01-08T00:00:00.000Z"),
    });

    const savedData = await imageCacheStorage.read(
      "cache/feed_thumbnail/did:plc:example123/bafkreiabc456.jpg",
    );
    expect(savedData).toEqual(resizedBlob.data);
  });

  test("異なるプリセットタイプで同じ画像を要求した場合、異なるキャッシュキーを使用する", async () => {
    // arrange
    const blob = ImageBlob.jpeg(new Uint8Array([1, 2, 3]));
    const resizedBlob1 = ImageBlob.jpeg(new Uint8Array([1, 2]));
    const resizedBlob2 = ImageBlob.jpeg(new Uint8Array([1]));

    didResolver.setResolveResult("did:plc:example789", {
      pds: new URL("https://example.pds.com"),
      signingKey: "test-signing-key",
      handle: "test.handle" as const,
    });

    blobFetcher.setFetchResult(
      {
        pds: new URL("https://example.pds.com"),
        did: "did:plc:example789",
        cid: "bafkreidef789",
      },
      blob,
    );

    imageResizer.setResizeResult(
      ImageProxyRequest.fromParams({
        did: "did:plc:example789",
        cid: "bafkreidef789",
        type: "avatar",
      }).preset,
      resizedBlob1,
    );

    imageResizer.setResizeResult(
      ImageProxyRequest.fromParams({
        did: "did:plc:example789",
        cid: "bafkreidef789",
        type: "avatar_thumbnail",
      }).preset,
      resizedBlob2,
    );

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
    const cache1 = await cacheMetadataRepo.get(
      "avatar/did:plc:example789/bafkreidef789",
    );
    const cache2 = await cacheMetadataRepo.get(
      "avatar_thumbnail/did:plc:example789/bafkreidef789",
    );

    expect(cache1).not.toBeNull();
    expect(cache1).toMatchObject({
      cacheKey: "avatar/did:plc:example789/bafkreidef789",
      status: "success",
      expiredAt: new Date("2024-01-08T00:00:00.000Z"),
    });

    expect(cache2).not.toBeNull();
    expect(cache2).toMatchObject({
      cacheKey: "avatar_thumbnail/did:plc:example789/bafkreidef789",
      status: "success",
      expiredAt: new Date("2024-01-08T00:00:00.000Z"),
    });
  });

  test("画像リサイズサービスがエラーをスローした場合、エラーがそのまま伝播する", async () => {
    // arrange
    const originalBlob = ImageBlob.jpeg(new Uint8Array([1, 2, 3]));

    didResolver.setResolveResult("did:plc:example888", {
      pds: new URL("https://example.pds.com"),
      signingKey: "test-signing-key",
      handle: "test.handle" as const,
    });

    blobFetcher.setFetchResult(
      {
        pds: new URL("https://example.pds.com"),
        did: "did:plc:example888",
        cid: "bafkreiabc888",
      },
      originalBlob,
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
    ).rejects.toThrow();
  });

  test("キャッシュ保存がエラーになった場合、エラーがそのまま伝播する", async () => {
    // arrange
    const originalBlob = ImageBlob.jpeg(new Uint8Array([1, 2, 3, 4, 5]));
    const resizedBlob = ImageBlob.jpeg(new Uint8Array([1, 2, 3]));
    const cacheKey = "avatar/did:plc:example777/bafkreiabc777";
    const cachePath = CacheMetadata.create({
      cacheKey,
      imageBlob: resizedBlob,
    }).getPath("cache");

    didResolver.setResolveResult("did:plc:example777", {
      pds: new URL("https://example.pds.com"),
      signingKey: "test-signing-key",
      handle: "test.handle" as const,
    });

    blobFetcher.setFetchResult(
      {
        pds: new URL("https://example.pds.com"),
        did: "did:plc:example777",
        cid: "bafkreiabc777",
      },
      originalBlob,
    );

    imageResizer.setResizeResult(
      ImageProxyRequest.fromParams({
        did: "did:plc:example777",
        cid: "bafkreiabc777",
        type: "avatar",
      }).preset,
      resizedBlob,
    );

    imageCacheStorage.setSaveError(cachePath, "Storage save failed");

    // act & assert
    await expect(
      imageProxyUseCase.execute(
        ImageProxyRequest.fromParams({
          did: "did:plc:example777",
          cid: "bafkreiabc777",
          type: "avatar",
        }),
      ),
    ).rejects.toThrow();

    const savedCache = await cacheMetadataRepo.get(cacheKey);
    expect(savedCache).not.toBeNull();
    expect(savedCache).toMatchObject({
      cacheKey,
      status: "success",
      expiredAt: new Date("2024-01-08T00:00:00.000Z"),
    });
  });

  test("ネガティブキャッシュがヒットした場合、nullを返してヒットメトリクスを記録する", async () => {
    // arrange
    await cacheMetadataRepo.save(
      new CacheMetadata({
        cacheKey: "avatar/did:plc:example555/bafkreiabc555",
        status: "failed",
        imageBlob: null,
        expiredAt: new Date("2024-01-01T00:05:00.000Z"),
      }),
    );

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
    expect(metricReporter.getCounter("blob_proxy_cache_hit_total")).toEqual(1);
  });

  test("BlobFetchFailedErrorが発生した場合、ネガティブキャッシュを保存してnullを返す", async () => {
    // arrange
    didResolver.setResolveResult("did:plc:example999", {
      pds: new URL("https://example.pds.com"),
      signingKey: "test-signing-key",
      handle: "test.handle" as const,
    });

    blobFetcher.setFetchError(
      {
        pds: new URL("https://example.pds.com"),
        did: "did:plc:example999",
        cid: "bafkreiabc999",
      },
      "NOT_FOUND",
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
    expect(metricReporter.getCounter("blob_proxy_cache_miss_total")).toEqual(1);
    expect(
      metricReporter.getCounter("blob_proxy_error_total", {
        error: "BlobFetchFailedError",
      }),
    ).toEqual(1);

    const savedCache = await cacheMetadataRepo.get(
      "banner/did:plc:example999/bafkreiabc999",
    );
    expect(savedCache).not.toBeNull();
    expect(savedCache).toMatchObject({
      cacheKey: "banner/did:plc:example999/bafkreiabc999",
      status: "failed",
      expiredAt: new Date("2024-01-01T00:05:00.000Z"),
    });
  });

  test("DidResolutionErrorが発生した場合、ネガティブキャッシュを保存してnullを返す", async () => {
    // arrange
    // DidResolverにresolve結果を設定しない（エラーになる）

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
    expect(metricReporter.getCounter("blob_proxy_cache_miss_total")).toEqual(1);
    expect(
      metricReporter.getCounter("blob_proxy_error_total", {
        error: "DidResolutionError",
      }),
    ).toEqual(1);

    const savedCache = await cacheMetadataRepo.get(
      "feed_fullsize/did:plc:example888/bafkreiabc888",
    );
    expect(savedCache).not.toBeNull();
    expect(savedCache).toMatchObject({
      cacheKey: "feed_fullsize/did:plc:example888/bafkreiabc888",
      status: "failed",
      expiredAt: new Date("2024-01-01T00:05:00.000Z"),
    });
  });
});
