import { createServer, type Server } from "node:http";

import { fakeCid, fakeDid } from "@repo/common/test";
import { asHandle } from "@repo/common/utils";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";

import { InMemoryJobLogger } from "../../../shared/job-logger.in-memory.js";
import { testRegistry, type TestServices } from "../../../shared/test-utils.js";

const did = fakeDid();
const uri = `at://${did}/app.bsky.feed.post/3kxyzabc`;

describe("FetchRecordUseCase", () => {
  let fetchRecordUseCase: TestServices["fetchRecordUseCase"];
  let didResolver: TestServices["didResolver"];
  let jobScheduler: TestServices["jobScheduler"];
  let pdsResponse: { status: number; body: object };
  let server: Server;
  let pdsUrl: URL;
  const jobLogger = new InMemoryJobLogger();

  beforeAll(async () => {
    server = createServer((_req, res) => {
      res.writeHead(pdsResponse.status, { "content-type": "application/json" });
      res.end(JSON.stringify(pdsResponse.body));
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error();
    pdsUrl = new URL(`http://127.0.0.1:${address.port}`);
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(async () => {
    const services = await testRegistry.resolve();
    fetchRecordUseCase = services.fetchRecordUseCase;
    didResolver = services.didResolver;
    jobScheduler = services.jobScheduler;
    didResolver.setResolveResult(did, {
      handle: asHandle("alice.test"),
      signingKey: "test-key",
      pds: pdsUrl,
    });
  });

  const execute = () =>
    fetchRecordUseCase.execute({ uri, depth: 0, live: false, jobLogger });

  test("fetchRecord-1: PDSにレコードがなければ、再試行せずに終える", async () => {
    // arrange
    pdsResponse = {
      status: 400,
      body: { error: "RecordNotFound", message: "Could not locate record" },
    };

    // act & assert
    await expect(execute()).resolves.toBeUndefined();
  });

  test("fetchRecord-2: PDSにリポジトリがないか、停止・凍結されていれば、再試行せずに終える", async () => {
    const errors = [
      { error: "InvalidRequest", message: `Could not find repo: ${did}` },
      { error: "RepoNotFound", message: `Repo ${did} not found` },
      {
        error: "RepoDeactivated",
        message: `Repo has been deactivated: ${did}`,
      },
      { error: "RepoTakendown", message: `Repo has been takendown: ${did}` },
    ];
    for (const body of errors) {
      // arrange
      pdsResponse = { status: 400, body };

      // act & assert
      await expect(execute()).resolves.toBeUndefined();
    }
  });

  test("fetchRecord-3: DIDが登録されていなければ、再試行せずに終える", async () => {
    // arrange
    didResolver.clear();

    // act & assert
    await expect(execute()).resolves.toBeUndefined();
  });

  test("fetchRecord-4: それ以外の失敗では再試行する", async () => {
    // arrange
    pdsResponse = {
      status: 502,
      body: { error: "UpstreamFailure", message: "Bad Gateway" },
    };

    // act & assert
    await expect(execute()).rejects.toThrow();
  });

  test("index-22: PDSから取得した投稿の返信先と起点は取得しない", async () => {
    // arrange
    const parentUri = "at://did:plc:parent/app.bsky.feed.post/parent";
    const rootUri = "at://did:plc:root/app.bsky.feed.post/root";
    pdsResponse = {
      status: 200,
      body: {
        uri,
        cid: fakeCid(),
        value: {
          $type: "app.bsky.feed.post",
          text: "reply",
          reply: {
            parent: { uri: parentUri, cid: fakeCid() },
            root: { uri: rootUri, cid: fakeCid() },
          },
          createdAt: new Date().toISOString(),
        },
      },
    };

    // act
    await execute();

    // assert
    const fetchUris = jobScheduler
      .getFetchRecordJobs()
      .map((job) => job.uri.toString());
    expect(fetchUris).not.toContain(parentUri);
    expect(fetchUris).not.toContain(rootUri);
  });
});
