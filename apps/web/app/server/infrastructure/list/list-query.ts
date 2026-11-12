import { AtUri } from "@atproto/syntax";
import getListFeed from "@repo/client/app/bsky/feed/getListFeed";
import type { ListView } from "@repo/client/app/bsky/graph/defs";
import getList from "@repo/client/app/bsky/graph/getList";
import getLists from "@repo/client/app/bsky/graph/getLists";
import getListsWithMembership from "@repo/client/app/bsky/graph/getListsWithMembership";

import type { ListDto } from "@/app/server/application/dto/list";
import type { IListQuery } from "@/app/server/application/interfaces/list-query";
import type { IOAuthClient } from "@/app/server/application/interfaces/oauth-client";
import {
  isShownInFeed,
  toTimelinePost,
} from "@/app/server/infrastructure/timeline/timeline-query";

const toList = (list: ListView): ListDto => ({
  uri: list.uri,
  rkey: new AtUri(list.uri).rkey,
  creatorDid: list.creator.did,
  name: list.name,
  description: list.description,
  avatarUrl: list.avatar,
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
    async findLists(did, account) {
      const agent = await restore(did);
      const { lists } = await agent.call(getLists, {
        actor: account,
        purposes: ["curatelist"],
      });
      return lists.map(toList);
    },
    async findList(did, account, rkey) {
      const agent = await restore(did);
      const { list, items } = await agent.call(getList, {
        list: `at://${account}/app.bsky.graph.list/${rkey}`,
      });
      return {
        list: toList(list),
        members: items.map(({ uri, subject }) => ({
          listItemUri: uri,
          did: subject.did,
          handle: subject.handle,
          displayName: subject.displayName,
          avatarUrl: subject.avatar,
          description: subject.description,
        })),
      };
    },
    async findListsWithMembership(did, subjectDid) {
      const agent = await restore(did);
      const { listsWithMembership } = await agent.call(getListsWithMembership, {
        actor: subjectDid,
        purposes: ["curatelist"],
      });
      return listsWithMembership.map(({ list, listItem }) => ({
        list: toList(list),
        listItemUri: listItem?.uri,
      }));
    },
    async findPosts(did, listUri) {
      const agent = await restore(did);
      const { feed } = await agent.call(getListFeed, { list: listUri });
      return feed.filter(isShownInFeed).map(toTimelinePost);
    },
  };
};
