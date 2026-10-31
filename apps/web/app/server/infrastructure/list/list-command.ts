import { currentDatetimeString } from "@atproto/syntax";
import list from "@repo/client/lex/app/bsky/graph/list";

import type { IOAuthClient } from "@/app/server/infrastructure/auth/oauth-client";

type ListInput = { name: string; description?: string };

export interface IListCommand {
  create: (did: string, input: ListInput) => Promise<void>;
  update: (did: string, rkey: string, input: ListInput) => Promise<void>;
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
  };
};
