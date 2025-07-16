import { Router } from "express";

import { env } from "../../shared/env.js";

const wellKnownRouter = Router();

wellKnownRouter.get("/.well-known/did.json", (req, res) => {
  res.json({
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: `did:web:${env.PUBLIC_DOMAIN}`,
    service: [
      {
        id: `#appview`,
        type: "AppView",
        serviceEndpoint: `https://${env.PUBLIC_DOMAIN}`,
      },
    ],
  });
});

export { wellKnownRouter };
