import { Router } from "express";

import { env } from "../../../../shared/env.js";

const wellKnownRouter: Router = Router();

wellKnownRouter.get("/.well-known/did.json", (_req, res) => {
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

export { wellKnownRouter };
