import { asDid } from "@atproto/did";
import { isPlainObject } from "@atproto/lex";
import {
  asAtUriString,
  AtUri,
  isValidUri,
  normalizeDatetimeAlways,
  toDatetimeString,
} from "@atproto/syntax";
import type * as ComAtprotoLabelDefs from "@repo/client/lex/com/atproto/label/defs";
import { selfLabels } from "@repo/client/lex/com/atproto/label/defs";

import type { LabelDto } from "../dto/label-dto.js";
import type { RecordDto } from "../dto/record-dto.js";

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

export const toSelfLabelViews = (
  record?: RecordDto,
): ComAtprotoLabelDefs.Label[] => {
  const json = record?.json;
  if (!record || !isPlainObject(json) || !selfLabels.matches(json.labels)) {
    return [];
  }
  const cts = normalizeDatetimeAlways(
    typeof json.createdAt === "string" ? json.createdAt : "",
  );
  return json.labels.values.map(({ val }) => ({
    src: asDid(new AtUri(record.uri).host),
    uri: asAtUriString(record.uri),
    cid: record.cid,
    val,
    cts,
  }));
};
