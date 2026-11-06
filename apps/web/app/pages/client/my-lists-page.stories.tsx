import { asAtUriString } from "@atproto/syntax";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { alice, type Data, queryClient } from "@/.storybook/query-client";
import type { loader as listsLoader } from "@/app/routes/api.lists.$handle";

import { MyListsPage } from "./my-lists-page";

const meta = {
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof listsLoader>>(
      ["lists", alice.handle],
      {
        lists: [
          {
            uri: asAtUriString("at://did:plc:alice/app.bsky.graph.list/1"),
            rkey: "1",
            creatorDid: alice.did,
            name: "友達",
            description: "よく話す人たち",
          },
          {
            uri: asAtUriString("at://did:plc:alice/app.bsky.graph.list/2"),
            rkey: "2",
            creatorDid: alice.did,
            name: "ニュース",
          },
        ],
        isSelf: true,
      },
    );
  },
  component: MyListsPage,
  parameters: {
    path: "/lists",
    layout: "fullscreen",
  },
} satisfies Meta<typeof MyListsPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};

export const Empty: StoryObj<typeof meta> = {
  beforeEach: () => {
    queryClient.setQueryData<Data<typeof listsLoader>>(
      ["lists", alice.handle],
      { lists: [], isSelf: true },
    );
  },
};
