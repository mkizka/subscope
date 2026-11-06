import "@/app/app.css";
import "./preview.css";

import type { $OutputBody as RegisteredAccountsResponse } from "@repo/client/me/subsco/admin/listRegisteredAccounts";
import type { Preview } from "@storybook/react-vite";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRoutesStub } from "react-router";

import type { loader as inviteCodesLoader } from "@/app/routes/admin.api.invite-codes";
import type { loader as meLoader } from "@/app/routes/api.me";
import type { loader as unreadCountLoader } from "@/app/routes/api.notifications.unread-count";
import type { loader as registeredAccountsLoader } from "@/app/routes/api.registered-accounts";
import type { loader as serverInfoLoader } from "@/app/routes/api.server-info";
import type { loader as trackedAccountsLoader } from "@/app/routes/api.tracked-accounts";

import { alice, bob, type Data, queryClient } from "./query-client";

queryClient.setQueryData<{
  pages: RegisteredAccountsResponse[];
  pageParams: unknown[];
}>(["registeredAccounts"], {
  pages: [
    {
      registeredAccounts: [
        {
          profile: alice,
          isAdmin: true,
          registeredAt: "2024-01-01T00:00:00.000Z",
          backfillStatus: "completed",
        },
        {
          profile: bob,
          isAdmin: false,
          registeredAt: "2024-01-02T00:00:00.000Z",
          backfillStatus: "inProgress",
        },
      ],
      total: 2,
    },
  ],
  pageParams: [undefined],
});

queryClient.setQueryData<{
  pages: Data<typeof inviteCodesLoader>[];
  pageParams: unknown[];
}>(["inviteCodes"], {
  pages: [
    {
      codes: [
        {
          code: "abc-123-def",
          expiresAt: "2099-12-31T23:59:59.000Z",
          createdAt: "2025-01-01T00:00:00.000Z",
        },
      ],
    },
  ],
  pageParams: [undefined],
});
const pageData = queryClient
  .getQueryCache()
  .getAll()
  .map(({ queryKey, state }) => [queryKey, state.data] as const);

const preview: Preview = {
  beforeEach: () => {
    queryClient.clear();
    for (const [key, data] of pageData) {
      queryClient.setQueryData(key, data);
    }
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
    queryClient.setQueryData<Data<typeof registeredAccountsLoader>>(
      ["clientRegisteredAccounts", ""],
      {
        registeredAccounts: [
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
    });
  },
  decorators: [
    (Story, { parameters }) => {
      const Stub = createRoutesStub([
        { path: "*", Component: Story, action: () => null },
      ]);
      return (
        <QueryClientProvider client={queryClient}>
          <Stub initialEntries={[parameters.path ?? "/"]} />
        </QueryClientProvider>
      );
    },
  ],
};

export default preview;
