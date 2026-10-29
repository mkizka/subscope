const PDS_URL = "http://localhost:2583";

const xrpc = async <T>(
  nsid: string,
  body: unknown,
  accessJwt?: string,
): Promise<T> => {
  const response = await fetch(`${PDS_URL}/xrpc/${nsid}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(accessJwt && { authorization: `Bearer ${accessJwt}` }),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${nsid} failed: ${await response.text()}`);
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return response.json() as Promise<T>;
};

export const createRecord = async (
  handle: string,
  collection: string,
  record: Record<string, unknown>,
  rkey?: string,
) => {
  const { did, accessJwt } = await xrpc<{ did: string; accessJwt: string }>(
    "com.atproto.server.createSession",
    { identifier: handle, password: "password" },
  );
  return xrpc<{ uri: string; cid: string }>(
    "com.atproto.repo.createRecord",
    { repo: did, collection, rkey, record: { $type: collection, ...record } },
    accessJwt,
  );
};

export const resolveDid = async (handle: string) => {
  const response = await fetch(
    `${PDS_URL}/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`,
  );
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { did } = (await response.json()) as { did: string };
  return did;
};
