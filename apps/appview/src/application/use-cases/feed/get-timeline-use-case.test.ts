/* eslint-disable @typescript-eslint/unbound-method */
import type { FeedItem } from "@repo/common/domain";
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";

import type { FeedProcessor } from "../../service/feed/feed-processor.js";
import type { TimelineService } from "../../service/feed/timeline-service.js";
import type { Page } from "../../utils/pagination.js";
import { GetTimelineUseCase } from "./get-timeline-use-case.js";

const mockTimelineService = mock<TimelineService>();
const mockFeedProcessor = mock<FeedProcessor>();
const getTimelineUseCase = new GetTimelineUseCase(
  mockTimelineService,
  mockFeedProcessor,
);

describe("GetTimelineUseCase", () => {
  test("パラメータが渡された場合、TimelineServiceに正しいパラメータを渡して呼び出す", async () => {
    // arrange
    const params = { limit: 50, viewerDid: "did:plc:testuser" } as const;
    const expectedCursor = undefined;

    const mockPaginationResult: Page<FeedItem> = {
      items: [],
      cursor: undefined,
    };

    mockTimelineService.findFeedItemsWithPagination.mockResolvedValue(
      mockPaginationResult,
    );
    mockFeedProcessor.processFeedItems.mockResolvedValue([]);

    // act
    await getTimelineUseCase.execute(params);

    // assert
    expect(
      mockTimelineService.findFeedItemsWithPagination,
    ).toHaveBeenCalledWith({
      viewerDid: params.viewerDid,
      cursor: expectedCursor,
      limit: params.limit,
    });
  });

  test("カーソルが指定された場合、Date型に変換してTimelineServiceに渡す", async () => {
    // arrange
    const cursorString = "2024-01-01T00:00:00.000Z";
    const params = {
      limit: 50,
      cursor: cursorString,
      viewerDid: "did:plc:testuser",
    } as const;
    const expectedCursor = new Date(cursorString);

    const mockPaginationResult: Page<FeedItem> = {
      items: [],
      cursor: undefined,
    };

    mockTimelineService.findFeedItemsWithPagination.mockResolvedValue(
      mockPaginationResult,
    );
    mockFeedProcessor.processFeedItems.mockResolvedValue([]);

    // act
    await getTimelineUseCase.execute(params);

    // assert
    expect(
      mockTimelineService.findFeedItemsWithPagination,
    ).toHaveBeenCalledWith({
      viewerDid: params.viewerDid,
      cursor: expectedCursor,
      limit: params.limit,
    });
  });

  test("TimelineServiceから結果を取得した場合、FeedProcessorに結果を渡す", async () => {
    // arrange
    const params = { limit: 50, viewerDid: "did:plc:testuser" } as const;

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

    mockTimelineService.findFeedItemsWithPagination.mockResolvedValue(
      mockPaginationResult,
    );
    mockFeedProcessor.processFeedItems.mockResolvedValue([]);

    // act
    await getTimelineUseCase.execute(params);

    // assert
    expect(mockFeedProcessor.processFeedItems).toHaveBeenCalledWith(
      mockPaginationResult.items,
      params.viewerDid,
    );
  });

  test("FeedProcessorから結果を取得した場合、その結果をそのまま返す", async () => {
    // arrange
    const params = { limit: 50, viewerDid: "did:plc:testuser" } as const;

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

    mockTimelineService.findFeedItemsWithPagination.mockResolvedValue({
      ...mockPaginationResult,
      cursor: "2024-01-01T00:00:00.000Z",
    });
    mockFeedProcessor.processFeedItems.mockResolvedValue(expectedFeed);

    // act
    const result = await getTimelineUseCase.execute(params);

    // assert
    expect(result).toEqual({
      feed: expectedFeed,
      cursor: "2024-01-01T00:00:00.000Z",
    });
  });

  test("limit=0の場合も正しく処理される", async () => {
    // arrange
    const params = { limit: 0, viewerDid: "did:plc:testuser" } as const;

    const mockPaginationResult: Page<FeedItem> = {
      items: [],
      cursor: undefined,
    };

    mockTimelineService.findFeedItemsWithPagination.mockResolvedValue(
      mockPaginationResult,
    );
    mockFeedProcessor.processFeedItems.mockResolvedValue([]);

    // act
    const result = await getTimelineUseCase.execute(params);

    // assert
    expect(
      mockTimelineService.findFeedItemsWithPagination,
    ).toHaveBeenCalledWith({
      viewerDid: params.viewerDid,
      cursor: undefined,
      limit: 0,
    });
    expect(result).toEqual({
      feed: [],
      cursor: undefined,
    });
  });
});
