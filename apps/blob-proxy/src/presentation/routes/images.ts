import type { ILoggerManager } from "@dawn/common/domain";
import type { Router } from "express";
import { Router as expressRouter } from "express";

import type { ImageTransformService } from "../../application/image-transform-service.js";
import {
  ImageTransformRequest,
  InvalidDidError,
  InvalidImagePresetError,
} from "../../domain/image-transform-request.js";

export function imagesRouterFactory(
  imageTransformService: ImageTransformService,
  loggerManager: ILoggerManager,
): Router {
  const router = expressRouter();
  const logger = loggerManager.createLogger("images-router");

  router.get("/:type/:did/:cid.jpg", async (req, res) => {
    try {
      const request = ImageTransformRequest.from(req.params);
      const result = await imageTransformService.getTransformedImage(request);

      res
        .type(result.contentType)
        .header("Cache-Control", "public, max-age=86400")
        .send(result.data);
    } catch (error) {
      if (
        error instanceof InvalidImagePresetError ||
        error instanceof InvalidDidError
      ) {
        logger.info(
          { params: req.params, error: error.message },
          "Invalid request parameters",
        );
        res.status(400).json({ error: error.message });
        return;
      }
      logger.error(
        { params: req.params, error },
        "Unexpected error occurred while processing image transform request",
      );
      throw error;
    }
  });

  return router;
}

imagesRouterFactory.inject = [
  "imageTransformService",
  "loggerManager",
] as const;
