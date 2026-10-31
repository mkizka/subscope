import {
  AtUri,
  type AtUriString,
  currentDatetimeString,
} from "@atproto/syntax";
import list from "@repo/client/lex/app/bsky/graph/list";
import listitem from "@repo/client/lex/app/bsky/graph/listitem";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

type ListInput = { name: string; description?: string };

export interface IListCommand {
  create: (did: string, input: ListInput) => Promise<void>;
  update: (did: string, rkey: string, input: ListInput) => Promise<void>;
  addMember: (
    did: string,
    listUri: AtUriString,
    subject: `did:${string}:${string}`,
  ) => Promise<void>;
  removeMember: (did: string, listItemUri: string) => Promise<void>;
  delete: (did: string, rkey: string) => Promise<void>;
}

export const listCommandFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IListCommand => {
  const restore = async (did: string) => {
    const agent = await oauthClient.restore(did);
    if (!agent) throw new Error("Failed to restore OAuth session");
    return agent;
  };
  return {
    async create(did, input) {
      const agent = await restore(did);
      await agent.create(list, {
        ...input,
        purpose: "app.bsky.graph.defs#curatelist",
        createdAt: currentDatetimeString(),
      });
    },
    async update(did, rkey, input) {
      const agent = await restore(did);
      const { value } = await agent.get(list, { rkey });
      await agent.put(
        list,
        {
          ...value,
          name: input.name,
          description: input.description,
          descriptionFacets: undefined,
        },
        { rkey },
      );
    },
    async addMember(did, listUri, subject) {
      const agent = await restore(did);
      await agent.create(listitem, {
        list: listUri,
        subject,
        createdAt: currentDatetimeString(),
      });
    },
    async removeMember(did, listItemUri) {
      const agent = await restore(did);
      await agent.delete(listitem, { rkey: new AtUri(listItemUri).rkey });
    },
    async delete(did, rkey) {
      const agent = await restore(did);
      const listUri = `at://${did}/app.bsky.graph.list/${rkey}`;
      let cursor: string | undefined;
      do {
        const page = await agent.list(listitem, { limit: 100, cursor });
        for (const record of page.records) {
          if (record.value.list !== listUri) continue;
          await agent.delete(listitem, { rkey: new AtUri(record.uri).rkey });
        }
        cursor = page.cursor;
      } while (cursor);
      await agent.delete(list, { rkey });
    },
  };
};
