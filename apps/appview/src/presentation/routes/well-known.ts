import { Router } from "express";

export const wellKnownRouterFactory = (
  serviceDid: string,
  publicUrl: string,
) => {
  const wellKnownRouter = Router();
  wellKnownRouter.get("/.well-known/did.json", (_req, res) => {
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
  return wellKnownRouter;
};
wellKnownRouterFactory.inject = ["serviceDid", "publicUrl"] as const;
