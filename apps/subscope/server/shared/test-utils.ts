import { setupBlobProxyFiles } from "@/server/features/blob-proxy/test-utils.js";
import { setupXrpcFiles } from "@/server/features/xrpc/test-utils.js";

export const setupFiles = () => {
  setupBlobProxyFiles();
  setupXrpcFiles();
};
