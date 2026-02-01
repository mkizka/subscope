import { setupBlobProxyFiles } from "../features/blob-proxy/test-utils.js";
import { setupXrpcFiles } from "../features/xrpc/test-utils.js";

export const setupFiles = () => {
  setupBlobProxyFiles();
  setupXrpcFiles();
};
