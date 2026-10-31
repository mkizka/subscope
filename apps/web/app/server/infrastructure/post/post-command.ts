import { TID } from "@atproto/common-web";
import { asAtUriString, AtUri, currentDatetimeString } from "@atproto/syntax";
import postRecord from "@repo/client/lex/app/bsky/feed/post";
import threadgate from "@repo/client/lex/app/bsky/feed/threadgate";

import type { ReplyRule } from "@/app/features/timeline/blocks/post-form";
import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

type PostRef = { uri: string; cid: string };

export type NewPost = {
  text: string;
  images: { file: File; alt: string }[];
  reply?: { root: PostRef; parent: PostRef };
  quote?: PostRef;
  allow?: ReplyRule[];
};

export interface IPostCommand {
  create: (did: string, post: NewPost) => Promise<string>;
  delete: (did: string, uri: string) => Promise<void>;
}

const THREADGATE_RULES = {
  follower: { $type: "app.bsky.feed.threadgate#followerRule" },
  following: { $type: "app.bsky.feed.threadgate#followingRule" },
  mention: { $type: "app.bsky.feed.threadgate#mentionRule" },
} as const satisfies Record<ReplyRule, unknown>;

const toStrongRef = ({ uri, cid }: PostRef) => ({
  uri: asAtUriString(uri),
  cid,
});

export const postCommandFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IPostCommand => {
  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("OAuth session not found");
    return agent;
  };
  return {
    async create(did, { text, images, reply, quote, allow }) {
      const agent = await restore(did);
      const rkey = TID.nextStr();
      const createdAt = currentDatetimeString();
      const uploaded = await Promise.all(
        images.map(async ({ file, alt }) => {
          const { body } = await agent.uploadBlob(file);
          return { image: body.blob, alt };
        }),
      );
      const media =
        uploaded.length > 0
          ? { $type: "app.bsky.embed.images" as const, images: uploaded }
          : undefined;
      const record = quote && { record: toStrongRef(quote) };
      const uri = `at://${did}/app.bsky.feed.post/${rkey}` as const;
      await agent.applyWrites((op) => [
        op.create(
          postRecord,
          {
            text,
            embed:
              record && media
                ? { $type: "app.bsky.embed.recordWithMedia", record, media }
                : record
                  ? { $type: "app.bsky.embed.record", ...record }
                  : media,
            reply: reply && {
              root: toStrongRef(reply.root),
              parent: toStrongRef(reply.parent),
            },
            createdAt,
          },
          { rkey },
        ),
        ...(allow
          ? [
              op.create(
                threadgate,
                {
                  post: uri,
                  allow: allow.map((rule) => THREADGATE_RULES[rule]),
                  createdAt,
                },
                { rkey },
              ),
            ]
          : []),
      ]);
      return uri;
    },
    async delete(did, uri) {
      const agent = await restore(did);
      await agent.delete(postRecord, { rkey: new AtUri(uri).rkey });
    },
  };
};
