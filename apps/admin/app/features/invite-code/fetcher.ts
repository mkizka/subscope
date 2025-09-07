import { SubscoBrowserAgent } from "@repo/client/api";

export const fetchInviteCodes = async ({
  pageParam,
}: {
  pageParam: string | undefined;
}) => {
  const agent = new SubscoBrowserAgent();
  const response = await agent.me.subsco.admin.getInviteCodes({
    limit: 5,
    cursor: pageParam,
  });
  return response.data;
};

export const createInviteCode = async () => {
  const agent = new SubscoBrowserAgent();
  const response = await agent.me.subsco.admin.createInviteCode({
    daysToExpire: 30,
  });
  return response.data;
};
