import { asDid } from "@atproto/did";
import { Router } from "express";

import type { BlobProxyService } from "../../application/blob-proxy-service.js";

export const blobRouterFactory = (blobProxyService: BlobProxyService) => {
  const blobRouter = Router();

  blobRouter.get("/:did/:cid", async (req, res) => {
    const result = await blobProxyService.getBlob({
      did: asDid(req.params.did),
      cid: req.params.cid,
    });
    res.set("Content-Type", result.contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(result.data));
  });

  return blobRouter;
};
blobRouterFactory.inject = ["blobProxyService"] as const;
