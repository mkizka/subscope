import { oauthClient } from "~/server/inject";

export function loader() {
  return Response.json(oauthClient.clientMetadata);
}
