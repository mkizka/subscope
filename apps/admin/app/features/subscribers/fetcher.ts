import { SubscoBrowserAgent } from "@repo/client/api";

export const fetchSubscribers = async ({
  pageParam,
}: {
  pageParam: string | undefined;
}) => {
  const agent = new SubscoBrowserAgent();
  const response = await agent.me.subsco.admin.getSubscribers({
    limit: 20,
    cursor: pageParam,
  });
  return response.data;
};
