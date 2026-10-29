import type { LexRouter } from "@atproto/lex-server";
import { savedFeedsPrefV2 } from "@repo/client/lex/app/bsky/actor/defs";
import getPreferences from "@repo/client/lex/app/bsky/actor/getPreferences";

export class GetPreferences {
  handle(router: LexRouter) {
    router.add(getPreferences, () => {
      return {
        body: {
          preferences: [
            savedFeedsPrefV2.build({
              items: [
                {
                  id: "3ksog462gr22d",
                  type: "timeline",
                  value: "following",
                  pinned: true,
                },
              ],
            }),
          ],
        },
      };
    });
  }
}
