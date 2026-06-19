import { Router } from "express";

export const wellKnownRouterFactory = (
  serviceDid: string,
  publicUrl: string,
): Router => {
  const router = Router();
  router.get("/.well-known/did.json", (_req, res) => {
    res.json({
      "@context": ["https://www.w3.org/ns/did/v1"],
      id: serviceDid,
      service: [
        {
          id: `#bsky_appview`,
          type: "BskyAppView",
          serviceEndpoint: publicUrl,
        },
      ],
    });
  });
  return router;
};
