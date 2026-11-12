import { Router } from "express";

import type { Env } from "../../shared/env.js";

export const wellKnownRouterFactory = ({
  env,
}: {
  env: Pick<Env, "SERVICE_DID" | "PUBLIC_URL">;
}): Router => {
  const router = Router();
  router.get("/.well-known/did.json", (_req, res) => {
    res.json({
      "@context": ["https://www.w3.org/ns/did/v1"],
      id: env.SERVICE_DID,
      service: [
        {
          id: `#bsky_appview`,
          type: "BskyAppView",
          serviceEndpoint: env.PUBLIC_URL,
        },
      ],
    });
  });
  return router;
};
