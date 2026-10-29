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

const createSession = (handle: string) =>
  xrpc<{ did: string; accessJwt: string }>("com.atproto.server.createSession", {
    identifier: handle,
    password: "password",
  });

export const createRecord = async (
  handle: string,
  collection: string,
  record: Record<string, unknown>,
) => {
  const { did, accessJwt } = await createSession(handle);
  return xrpc<{ uri: string; cid: string }>(
    "com.atproto.repo.createRecord",
    { repo: did, collection, record: { $type: collection, ...record } },
    accessJwt,
  );
};

export const putProfile = async (handle: string) => {
  const { did, accessJwt } = await createSession(handle);
  const collection = "app.bsky.actor.profile";
  await xrpc(
    "com.atproto.repo.putRecord",
    { repo: did, collection, rkey: "self", record: { $type: collection } },
    accessJwt,
  );
};
