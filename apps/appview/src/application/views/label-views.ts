import { asDid } from "@atproto/did";
import { isValidUri, toDatetimeString } from "@atproto/syntax";
import type * as ComAtprotoLabelDefs from "@repo/client/lex/com/atproto/label/defs";

import type { LabelDto } from "../dto/label-dto.js";

export const toLabelViews = (
  labels: LabelDto[] = [],
): ComAtprotoLabelDefs.Label[] =>
  labels.flatMap(({ src, uri, cid, val, cts }) =>
    isValidUri(uri)
      ? [
          {
            src: asDid(src),
            uri,
            cid: cid ?? undefined,
            val,
            cts: toDatetimeString(cts),
          },
        ]
      : [],
  );
