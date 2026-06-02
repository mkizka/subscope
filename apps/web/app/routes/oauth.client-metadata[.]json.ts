import { oauthClient } from "@/app/lib/oauth/client.server";

export const loader = () => {
  return Response.json(oauthClient.clientMetadata);
};
