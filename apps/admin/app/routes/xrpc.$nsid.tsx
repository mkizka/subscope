import { data } from "react-router";

import { loggerManager, oauthSession } from "~/server/inject";

import type { Route } from "./+types/xrpc.$nsid";

const SUPPORTED_NSIDS = [
  "app.bsky.actor.getProfile",
  "me.subsco.admin.getInviteCodes",
  "me.subsco.admin.createInviteCode",
];

const parseBody = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const logger = loggerManager.createLogger("xrpc-proxy");

  if (!SUPPORTED_NSIDS.includes(params.nsid)) {
    return data({ error: "Invalid NSID" }, { status: 400 });
  }

  const agent = await oauthSession.getAgent(request);

  if (!agent) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const body = await parseBody(request);

  try {
    const response = await agent.call(
      params.nsid,
      Object.fromEntries(url.searchParams),
      body,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  } catch (error) {
    const message = `Failed to call ${params.nsid}`;
    logger.error(error, message);
    return data({ error: message }, { status: 500 });
  }
}
