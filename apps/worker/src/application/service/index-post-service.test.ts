import type { TransactionContext } from "@dawn/common/domain";
import { Post, Record } from "@dawn/common/domain";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import type { IPostRepository } from "../interfaces/post-repository.js";
import type { ISubscriptionRepository } from "../interfaces/subscription-repository.js";
import { IndexPostService } from "./index-post-service.js";

describe("IndexPostService", () => {
  let service: IndexPostService;
  let mockPostRepository: IPostRepository;
  let mockSubscriptionRepository: ISubscriptionRepository;
  let mockCtx: TransactionContext;

  beforeEach(() => {
    mockPostRepository = {
      upsert: vi.fn(),
      existsAny: vi.fn(),
    };
    mockSubscriptionRepository = {
      upsert: vi.fn(),
      isSubscriber: vi.fn(),
      hasSubscriberFollower: vi.fn(),
    };
    mockCtx = {} as TransactionContext;

    service = new IndexPostService(
      mockPostRepository,
      mockSubscriptionRepository,
    );
  });

  describe("upsert", () => {
    it("投稿者がsubscriberの場合は投稿を保存する", async () => {
      const mockRecord = Record.fromJson({
        uri: "at://did:example:alice/app.bsky.feed.post/123",
        cid: "bafyreib2cyuq4wlb2d2643ktta3tqn7s5gmwbrsabohrfqrxcwazajx7za",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello world",
          createdAt: "2023-01-01T00:00:00.000Z",
        },
      });

      (mockSubscriptionRepository.isSubscriber as Mock).mockResolvedValue(true);

      await service.upsert({ ctx: mockCtx, record: mockRecord });

      expect(mockPostRepository.upsert).toHaveBeenCalledWith({
        ctx: mockCtx,
        post: expect.any(Post),
      });
    });

    it("親投稿がDBに存在する場合はリプライを保存する", async () => {
      const parentRef = {
        uri: "at://did:example:bob/app.bsky.feed.post/456",
        cid: "bafyreihk2xqt6eibvhw7n6uekwp2xqjhqgd5mcrw2vqv6kqfbacaexmmiq",
      };
      const mockRecord = Record.fromJson({
        uri: "at://did:example:alice/app.bsky.feed.post/123",
        cid: "bafyreib2cyuq4wlb2d2643ktta3tqn7s5gmwbrsabohrfqrxcwazajx7za",
        json: {
          $type: "app.bsky.feed.post",
          text: "Reply to post",
          createdAt: "2023-01-01T00:00:00.000Z",
          reply: {
            parent: parentRef,
            root: parentRef,
          },
        },
      });

      (mockSubscriptionRepository.isSubscriber as Mock).mockResolvedValue(
        false,
      );
      (mockPostRepository.existsAny as Mock).mockResolvedValue(true);

      await service.upsert({ ctx: mockCtx, record: mockRecord });

      expect(mockPostRepository.existsAny).toHaveBeenCalledWith(mockCtx, [
        "at://did:example:bob/app.bsky.feed.post/456",
      ]);
      expect(mockPostRepository.upsert).toHaveBeenCalledWith({
        ctx: mockCtx,
        post: expect.any(Post),
      });
    });

    it("投稿者にsubscriberのフォロワーがいる場合は投稿を保存する", async () => {
      const mockRecord = Record.fromJson({
        uri: "at://did:example:alice/app.bsky.feed.post/123",
        cid: "bafyreib2cyuq4wlb2d2643ktta3tqn7s5gmwbrsabohrfqrxcwazajx7za",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello world",
          createdAt: "2023-01-01T00:00:00.000Z",
        },
      });

      (mockSubscriptionRepository.isSubscriber as Mock).mockResolvedValue(
        false,
      );
      (
        mockSubscriptionRepository.hasSubscriberFollower as Mock
      ).mockResolvedValue(true);

      await service.upsert({ ctx: mockCtx, record: mockRecord });

      expect(
        mockSubscriptionRepository.hasSubscriberFollower,
      ).toHaveBeenCalledWith(mockCtx, "did:example:alice");
      expect(mockPostRepository.upsert).toHaveBeenCalledWith({
        ctx: mockCtx,
        post: expect.any(Post),
      });
    });

    it("保存条件を満たさない場合は投稿を保存しない", async () => {
      const mockRecord = Record.fromJson({
        uri: "at://did:example:alice/app.bsky.feed.post/123",
        cid: "bafyreib2cyuq4wlb2d2643ktta3tqn7s5gmwbrsabohrfqrxcwazajx7za",
        json: {
          $type: "app.bsky.feed.post",
          text: "Hello world",
          createdAt: "2023-01-01T00:00:00.000Z",
        },
      });

      (mockSubscriptionRepository.isSubscriber as Mock).mockResolvedValue(
        false,
      );
      (
        mockSubscriptionRepository.hasSubscriberFollower as Mock
      ).mockResolvedValue(false);

      await service.upsert({ ctx: mockCtx, record: mockRecord });

      expect(mockPostRepository.upsert).not.toHaveBeenCalled();
    });
  });
});
