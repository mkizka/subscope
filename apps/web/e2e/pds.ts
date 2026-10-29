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
) => {
  const { did, accessJwt } = await xrpc<{ did: string; accessJwt: string }>(
    "com.atproto.server.createSession",
    { identifier: handle, password: "password" },
  );
  return xrpc<{ uri: string; cid: string }>(
    "com.atproto.repo.createRecord",
    { repo: did, collection, record: { $type: collection, ...record } },
    accessJwt,
  );
};

export const resolveHandle = async (handle: string) => {
  const response = await fetch(
    `${PDS_URL}/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`,
  );
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { did } = (await response.json()) as { did: string };
  return did;
};

export const putRecord = async (
  handle: string,
  collection: string,
  rkey: string,
  record: Record<string, unknown>,
) => {
  const { did, accessJwt } = await xrpc<{ did: string; accessJwt: string }>(
    "com.atproto.server.createSession",
    { identifier: handle, password: "password" },
  );
  return xrpc<{ uri: string; cid: string }>(
    "com.atproto.repo.putRecord",
    { repo: did, collection, rkey, record: { $type: collection, ...record } },
    accessJwt,
  );
};

export const follow = async (handle: string, subjectHandle: string) => {
  const [did, subject] = await Promise.all([
    resolveHandle(handle),
    resolveHandle(subjectHandle),
  ]);
  const response = await fetch(
    `${PDS_URL}/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=app.bsky.graph.follow`,
  );
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { records } = (await response.json()) as {
    records: { value: { subject: string } }[];
  };
  if (records.some((record) => record.value.subject === subject)) return;
  await createRecord(handle, "app.bsky.graph.follow", {
    subject,
    createdAt: new Date().toISOString(),
  });
};

export const subscribeServer = async (handle: string, inviteCode: string) => {
  const { accessJwt } = await xrpc<{ accessJwt: string }>(
    "com.atproto.server.createSession",
    { identifier: handle, password: "password" },
  );
  return fetch(`${PDS_URL}/xrpc/me.subsco.sync.subscribeServer`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessJwt}`,
      "atproto-proxy": "did:web:localhost%3A3001#bsky_appview",
    },
    body: JSON.stringify({ inviteCode }),
  });
};
