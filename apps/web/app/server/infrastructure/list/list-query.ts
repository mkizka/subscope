import { type AtIdentifierString, AtUri } from "@atproto/syntax";
import getListFeed from "@repo/client/lex/app/bsky/feed/getListFeed";
import type { ListView } from "@repo/client/lex/app/bsky/graph/defs";
import getList from "@repo/client/lex/app/bsky/graph/getList";
import getLists from "@repo/client/lex/app/bsky/graph/getLists";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";
import {
  type TimelinePostDto,
  toTimelinePost,
} from "@/app/server/infrastructure/timeline/timeline-query";

export type ListDto = {
  uri: ListView["uri"];
  rkey: string;
  creatorDid: string;
  name: string;
  description?: string;
};

export type ListMemberDto = {
  did: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  description?: string;
};

export interface IListQuery {
  findLists: (did: string, actor: AtIdentifierString) => Promise<ListDto[]>;
  findList: (
    did: string,
    actor: AtIdentifierString,
    rkey: string,
  ) => Promise<{ list: ListDto; members: ListMemberDto[] }>;
  findPosts: (
    did: string,
    listUri: ListDto["uri"],
  ) => Promise<TimelinePostDto[]>;
}

const toList = (list: ListView): ListDto => ({
  uri: list.uri,
  rkey: new AtUri(list.uri).rkey,
  creatorDid: list.creator.did,
  name: list.name,
  description: list.description,
});

export const listQueryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IListQuery => {
  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("OAuth session not found");
    return agent;
  };
  return {
    async findLists(did, actor) {
      const agent = await restore(did);
      const { lists } = await agent.call(getLists, {
        actor,
        purposes: ["curatelist"],
      });
      return lists.map(toList);
    },
    async findList(did, actor, rkey) {
      const agent = await restore(did);
      const { list, items } = await agent.call(getList, {
        list: `at://${actor}/app.bsky.graph.list/${rkey}`,
      });
      return {
        list: toList(list),
        members: items.map(({ subject }) => ({
          did: subject.did,
          handle: subject.handle,
          displayName: subject.displayName,
          avatarUrl: subject.avatar,
          description: subject.description,
        })),
      };
    },
    async findPosts(did, listUri) {
      const agent = await restore(did);
      const { feed } = await agent.call(getListFeed, { list: listUri });
      return feed.map(toTimelinePost);
    },
  };
};
