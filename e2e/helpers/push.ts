import type { Browser } from "@playwright/test";
import {
  createPushReceiver,
  installPushManagerMock,
} from "@repo/web-push-mock";

const DEVELOPMENT_VAPID_PUBLIC_KEY =
  "BE-yfiTXTZBW7fGBJFpzslYpc1PUzl_aUvcOV70r1V7cU2jvzvpLW1m3LJiwXUCqItMcvIACzVOPsTtM6sgoKRM";

export const openDevice = async (
  browser: Browser,
  options: { baseURL: string; storageState: string },
) => {
  const receiver = await createPushReceiver({
    vapidPublicKey: DEVELOPMENT_VAPID_PUBLIC_KEY,
  });
  const context = await browser.newContext(options);
  await context.grantPermissions(["notifications"], {
    origin: options.baseURL,
  });
  await context.addInitScript(installPushManagerMock, receiver.subscription);
  return { context, page: await context.newPage(), receiver };
};
