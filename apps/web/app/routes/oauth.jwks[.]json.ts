import { di } from "@/app/server/di";

export const loader = () => {
  return Response.json(di.oauthClient.jwks);
};
