import type { Router } from "express";
import { Router as expressRouter } from "express";

import type { ImageTransformService } from "../../application/image-transform-service.js";
import { BlobFetchFailedError } from "../../application/interfaces/blob-fetcher.js";
import { ImageTransformRequest } from "../../domain/image-transform-request.js";

export function imagesRouterFactory(
  imageTransformService: ImageTransformService,
): Router {
  const router = expressRouter();

  router.get("/:type/:did/:cid.jpg", async (req, res) => {
    try {
      const request = ImageTransformRequest.fromParams(req.params);
      const result = await imageTransformService.getTransformedImage(request);
      res
        .type(result.contentType)
        .header("Cache-Control", "public, max-age=86400")
        .send(result.data);
    } catch (e) {
      if (e instanceof BlobFetchFailedError) {
        res.status(404).send(e.message);
        return;
      }
      throw e;
    }
  });

  return router;
}
imagesRouterFactory.inject = ["imageTransformService"] as const;
