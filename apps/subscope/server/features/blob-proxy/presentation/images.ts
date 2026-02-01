import type { IMetricReporter } from "@repo/common/domain";
import type { Router } from "express";
import { Router as expressRouter } from "express";

import type { ImageProxyUseCase } from "@/server/features/blob-proxy/application/image-proxy-use-case.js";
import { ImageProxyRequest } from "@/server/features/blob-proxy/domain/image-proxy-request.js";

export function imagesRouterFactory(
  imageProxyUseCase: ImageProxyUseCase,
  metricReporter: IMetricReporter,
): Router {
  const router = expressRouter();

  router.get("/:type/:did/:cid.jpg", async (req, res) => {
    try {
      const request = ImageProxyRequest.fromParams(req.params);
      const result = await imageProxyUseCase.execute(request);
      if (!result) {
        res.status(404).send("Image not found");
        return;
      }
      res
        .type(result.contentType)
        .header("Cache-Control", "public, max-age=86400")
        .send(result.data);
    } catch (e) {
      metricReporter.increment("blob_proxy_error_total", {
        error: String(e),
      });
      throw e;
    }
  });

  return router;
}
imagesRouterFactory.inject = ["imageProxyUseCase", "metricReporter"] as const;
