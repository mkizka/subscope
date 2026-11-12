import type { Browser } from "@playwright/test";
import {
  createPushReceiver,
  installPushManagerMock,
} from "@repo/web-push-mock";

export const openDevice = async (
  browser: Browser,
  options: { baseURL: string; storageState: string },
) => {
  const receiver = await createPushReceiver();
  const context = await browser.newContext(options);
  await context.grantPermissions(["notifications"], {
    origin: options.baseURL,
  });
  await context.addInitScript(installPushManagerMock, receiver.subscription);
  return { context, page: await context.newPage(), receiver };
};
