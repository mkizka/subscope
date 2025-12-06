import { CID } from "multiformats/cid";
import * as raw from "multiformats/codecs/raw";
import { sha256 } from "multiformats/hashes/sha2";

export async function randomCid() {
  const randomData = new Uint8Array(32);
  crypto.getRandomValues(randomData);

  const hash = await sha256.digest(randomData);
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- @atproto/lex-dataへの移行はATProtoのCommonJS対応後
  const cid = CID.create(1, raw.code, hash);

  return cid.toString();
}
