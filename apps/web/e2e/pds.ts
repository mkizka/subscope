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

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export const uploadImage = async (handle: string) => {
  const { accessJwt } = await xrpc<{ accessJwt: string }>(
    "com.atproto.server.createSession",
    { identifier: handle, password: "password" },
  );
  const response = await fetch(`${PDS_URL}/xrpc/com.atproto.repo.uploadBlob`, {
    method: "POST",
    headers: {
      "content-type": "image/png",
      authorization: `Bearer ${accessJwt}`,
    },
    body: new Blob([Buffer.from(PNG_BASE64, "base64")]),
  });
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { blob } = (await response.json()) as { blob: unknown };
  return blob;
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
  const lxm = "me.subsco.sync.subscribeServer";
  const serviceAuth = await fetch(
    `${PDS_URL}/xrpc/com.atproto.server.getServiceAuth?aud=did:web:localhost%253A3001&lxm=${lxm}`,
    { headers: { authorization: `Bearer ${accessJwt}` } },
  );
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { token } = (await serviceAuth.json()) as { token: string };
  const response = await fetch(`http://localhost:3001/xrpc/${lxm}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ inviteCode }),
  });
  const body = await response.text();
  if (!response.ok && !body.includes("AlreadySubscribed")) {
    throw new Error(`${lxm} failed: ${body}`);
  }
};

export const uploadBlob = async (
  handle: string,
  body: Uint8Array<ArrayBuffer>,
) => {
  const { accessJwt } = await xrpc<{ accessJwt: string }>(
    "com.atproto.server.createSession",
    { identifier: handle, password: "password" },
  );
  const response = await fetch(`${PDS_URL}/xrpc/com.atproto.repo.uploadBlob`, {
    method: "POST",
    headers: {
      "content-type": "image/png",
      authorization: `Bearer ${accessJwt}`,
    },
    body,
  });
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const { blob } = (await response.json()) as {
    blob: { ref: { $link: string } };
  };
  return blob;
};
