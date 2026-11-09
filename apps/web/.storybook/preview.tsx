import "@/app/app.css";
import "./preview.css";

import type { Preview } from "@storybook/react-vite";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRoutesStub } from "react-router";

import type { loader as meLoader } from "@/app/routes/api.me";
import type { loader as unreadCountLoader } from "@/app/routes/api.notifications.unread-count";
import type { loader as serverMembersLoader } from "@/app/routes/api.registered-accounts";
import type { loader as serverInfoLoader } from "@/app/routes/api.server-info";
import type { loader as trackedAccountsLoader } from "@/app/routes/api.tracked-accounts";

import { alice, bob, type Data, queryClient } from "./query-client";

const preview: Preview = {
  beforeEach: () => {
    queryClient.clear();
    queryClient.setQueryData<Data<typeof meLoader>>(["me"], {
      did: alice.did,
      avatarUrl: undefined,
      handle: alice.handle,
      isAdmin: true,
    });
    queryClient.setQueryData<Data<typeof unreadCountLoader>>(
      ["notifications", "unread-count"],
      { count: 2 },
    );
    queryClient.setQueryData<Data<typeof serverMembersLoader>>(
      ["clientServerMembers", ""],
      {
        serverMembers: [
          { ...alice, isAdmin: true },
          { did: "did:plc:carol", handle: "handle.invalid", isAdmin: false },
        ],
        hasMore: false,
      },
    );
    queryClient.setQueryData<Data<typeof trackedAccountsLoader>>(
      ["trackedAccounts", ""],
      {
        total: 3,
        accounts: [
          { ...bob, registeredFollowersCount: 3 },
          { ...alice, registeredFollowersCount: 1 },
          {
            did: "did:plc:carol",
            handle: "handle.invalid",
            registeredFollowersCount: 0,
          },
        ],
      },
    );
    queryClient.setQueryData<Data<typeof serverInfoLoader>>(["server"], {
      serviceDid: "did:web:subsco.me",
      operator: undefined,
    });
  },
  decorators: [
    (Story, { parameters }) => {
      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
      const Stub = createRoutesStub([
        {
          path: "*",
          ...parameters.route,
          Component: Story,
          action: parameters.action ?? (() => null),
        },
      ]);
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
      return (
        <QueryClientProvider client={queryClient}>
          <Stub initialEntries={[parameters.path ?? "/"]} />
        </QueryClientProvider>
      );
    },
  ],
};

export default preview;
