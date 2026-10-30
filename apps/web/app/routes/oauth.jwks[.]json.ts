import { services } from "@/app/server";

export const loader = () => {
  return Response.json(services.oauthClient.jwks);
};
