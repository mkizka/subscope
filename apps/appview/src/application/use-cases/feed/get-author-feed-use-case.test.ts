/* eslint-disable @typescript-eslint/unbound-method */
import { asDid } from "@atproto/did";
import type { FeedItem } from "@repo/common/domain";
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";

import type { AuthorFeedService } from "../../service/feed/author-feed-service.js";
import type { FeedProcessor } from "../../service/feed/feed-processor.js";
import type { Page } from "../../utils/pagination.js";
import { GetAuthorFeedUseCase } from "./get-author-feed-use-case.js";

const mockAuthorFeedService = mock<AuthorFeedService>();
const mockFeedProcessor = mock<FeedProcessor>();
const getAuthorFeedUseCase = new GetAuthorFeedUseCase(
  mockAuthorFeedService,
  mockFeedProcessor,
);

describe("GetAuthorFeedUseCase", () => {
  test("posts_and_author_threadsフィルターの場合、AuthorFeedServiceを呼び出す", async () => {
    // arrange
    const actorDid = asDid("did:plc:testuser");
    const params = {
      actorDid,
      limit: 50,
      filter: "posts_and_author_threads" as const,
      includePins: false,
    };

    const mockPaginationResult: Page<FeedItem> = {
      items: [],
      cursor: undefined,
    };

    mockAuthorFeedService.findFeedItemsWithPagination.mockResolvedValue(
      mockPaginationResult,
    );
    mockFeedProcessor.processFeedItems.mockResolvedValue([]);

    // act
    await getAuthorFeedUseCase.execute(params);

    // assert
    expect(
      mockAuthorFeedService.findFeedItemsWithPagination,
    ).toHaveBeenCalledWith({
      actorDid,
      cursor: undefined,
      limit: 50,
    });
  });

  test("cursorが指定された場合、Date型として渡される", async () => {
    // arrange
    const actorDid = asDid("did:plc:testuser");
    const cursor = new Date("2024-01-01T00:00:00.000Z");
    const params = {
      actorDid,
      limit: 50,
      cursor,
      filter: "posts_and_author_threads" as const,
      includePins: false,
    };

    const mockPaginationResult: Page<FeedItem> = {
      items: [],
      cursor: undefined,
    };

    mockAuthorFeedService.findFeedItemsWithPagination.mockResolvedValue(
      mockPaginationResult,
    );
    mockFeedProcessor.processFeedItems.mockResolvedValue([]);

    // act
    await getAuthorFeedUseCase.execute(params);

    // assert
    expect(
      mockAuthorFeedService.findFeedItemsWithPagination,
    ).toHaveBeenCalledWith({
      actorDid,
      cursor,
      limit: 50,
    });
  });

  test("AuthorFeedServiceの結果をFeedProcessorに渡す", async () => {
    // arrange
    const actorDid = asDid("did:plc:testuser");
    const params = {
      actorDid,
      limit: 50,
      filter: "posts_and_author_threads" as const,
      includePins: false,
    };

    const mockPaginationResult: Page<FeedItem> = {
      items: [
        {
          type: "post",
          uri: "at://example.com/post/1",
          actorDid: "did:plc:author1",
          cid: "cid1",
          sortAt: new Date(),
          subjectUri: null,
        },
        {
          type: "repost",
          uri: "at://example.com/repost/1",
          actorDid: "did:plc:reposter",
          cid: "cid2",
          sortAt: new Date(),
          subjectUri: "at://example.com/post/2",
        },
      ],
      cursor: "2024-01-01T00:00:00.000Z",
    };

    mockAuthorFeedService.findFeedItemsWithPagination.mockResolvedValue(
      mockPaginationResult,
    );
    mockFeedProcessor.processFeedItems.mockResolvedValue([]);

    // act
    await getAuthorFeedUseCase.execute(params);

    // assert
    expect(mockFeedProcessor.processFeedItems).toHaveBeenCalledWith(
      mockPaginationResult.items,
    );
  });

  test("FeedProcessorの結果をそのまま返す", async () => {
    // arrange
    const actorDid = asDid("did:plc:testuser");
    const params = {
      actorDid,
      limit: 50,
      filter: "posts_and_author_threads" as const,
      includePins: false,
    };

    const mockPaginationResult: Page<FeedItem> = {
      items: [],
      cursor: undefined,
    };

    const expectedFeed = [
      {
        $type: "app.bsky.feed.defs#feedViewPost" as const,
        post: {
          uri: "at://example.com/post/1",
          cid: "cid123",
          author: { did: "did:plc:author1", handle: "author.test" },
          record: { $type: "app.bsky.feed.post", text: "Test post" },
          indexedAt: "2024-01-01T00:00:00.000Z",
        },
      },
    ];

    mockAuthorFeedService.findFeedItemsWithPagination.mockResolvedValue({
      ...mockPaginationResult,
      cursor: "2024-01-01T00:00:00.000Z",
    });
    mockFeedProcessor.processFeedItems.mockResolvedValue(expectedFeed);

    // act
    const result = await getAuthorFeedUseCase.execute(params);

    // assert
    expect(result).toEqual({
      feed: expectedFeed,
      cursor: "2024-01-01T00:00:00.000Z",
    });
  });

  test("サポートされていないフィルターの場合、空のフィードを返す", async () => {
    // arrange
    const actorDid = asDid("did:plc:testuser");
    const params = {
      actorDid,
      limit: 50,
      filter: "posts_with_media" as const,
      includePins: false,
    };

    // act
    const result = await getAuthorFeedUseCase.execute(params);

    // assert
    expect(result).toEqual({
      feed: [],
      cursor: undefined,
    });
    expect(
      mockAuthorFeedService.findFeedItemsWithPagination,
    ).not.toHaveBeenCalled();
    expect(mockFeedProcessor.processFeedItems).not.toHaveBeenCalled();
  });

  test("limit=0の場合も正しく処理される", async () => {
    // arrange
    const actorDid = asDid("did:plc:testuser");
    const params = {
      actorDid,
      limit: 0,
      filter: "posts_and_author_threads" as const,
      includePins: false,
    };

    const mockPaginationResult: Page<FeedItem> = {
      items: [],
      cursor: undefined,
    };

    mockAuthorFeedService.findFeedItemsWithPagination.mockResolvedValue(
      mockPaginationResult,
    );
    mockFeedProcessor.processFeedItems.mockResolvedValue([]);

    // act
    const result = await getAuthorFeedUseCase.execute(params);

    // assert
    expect(
      mockAuthorFeedService.findFeedItemsWithPagination,
    ).toHaveBeenCalledWith({
      actorDid,
      cursor: undefined,
      limit: 0,
    });
    expect(result).toEqual({
      feed: [],
      cursor: undefined,
    });
  });

  test("includePinsパラメータが正しく渡される", async () => {
    // arrange
    const actorDid = asDid("did:plc:testuser");
    const params = {
      actorDid,
      limit: 50,
      filter: "posts_and_author_threads" as const,
      includePins: true,
    };

    const mockPaginationResult: Page<FeedItem> = {
      items: [],
      cursor: undefined,
    };

    mockAuthorFeedService.findFeedItemsWithPagination.mockResolvedValue(
      mockPaginationResult,
    );
    mockFeedProcessor.processFeedItems.mockResolvedValue([]);

    // act
    await getAuthorFeedUseCase.execute(params);

    // assert
    expect(
      mockAuthorFeedService.findFeedItemsWithPagination,
    ).toHaveBeenCalledWith({
      actorDid,
      cursor: undefined,
      limit: 50,
    });
  });
});
