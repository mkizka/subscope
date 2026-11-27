import { execSync, spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { connect, createServer as createTcpServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { TestNetworkNoAppView } from "@atproto/dev-env";
import { getKey } from "@atproto/identity";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, Wait } from "testcontainers";

const PORTS = {
  plc: 2582,
  pds: 2583,
  tap: 2480,
  jetstream: 6008,
  jetstreamRelay: 2584,
  jetstreamPlc: 2585,
  blobProxy: 3002,
};

const PLC_URL = `http://localhost:${PORTS.plc}`;
const PDS_URL = `http://localhost:${PORTS.pds}`;

// TestNetworkのPDSはos.tmpdir()以下にデータを作って終了後も残すので、専用ディレクトリに集めて終了時に消す
const tmp = await mkdtemp(join(tmpdir(), "subscope-dev-env-"));
process.env.TMPDIR = tmp;

const [postgres, redis] = await Promise.all([
  new PostgreSqlContainer("postgres:16-alpine").start(),
  new GenericContainer("redis:7").withExposedPorts(6379).start(),
]);
const DATABASE_URL = postgres.getConnectionUri();
const REDIS_URL = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;
execSync("pnpm -s run db:migrate", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL },
});

const network = await TestNetworkNoAppView.create({
  plc: { port: PORTS.plc },
  pds: {
    port: PORTS.pds,
    hostname: "localhost",
    bskyAppViewUrl: "http://localhost:3001",
    bskyAppViewDid: "did:web:localhost%3A3001",
  },
});

for (const name of [
  "alice",
  "bob",
  "carol",
  "dave",
  "erin",
  "frank",
  "grace",
  "heidi",
  "ivan",
]) {
  await network.pds.getAgent().createAccount({
    handle: `${name}.test`,
    email: `${name}@example.com`,
    password: "password",
  });
}

const lexiconAgent = network.pds.getAgent();
const lexiconAuthority = await lexiconAgent.createAccount({
  handle: "lex-authority.test",
  email: "lex-authority@example.com",
  password: "password",
});
network.pds.ctx.cfg.lexicon.didAuthority = lexiconAuthority.data.did;
for (const lexicon of [
  new URL(
    "../packages/client/lexicons/me/subsco/authFull.json",
    import.meta.url,
  ),
  new URL(
    "../packages/client/lexicons/app/bsky/authViewAll.json",
    import.meta.url,
  ),
]) {
  const record = JSON.parse(await readFile(lexicon, "utf-8"));
  await lexiconAgent.com.atproto.repo.createRecord({
    repo: lexiconAuthority.data.did,
    collection: "com.atproto.lexicon.schema",
    rkey: record.id,
    record,
  });
}

const tap = await new GenericContainer("ghcr.io/bluesky-social/indigo/tap:0.1")
  .withNetworkMode("host")
  .withEnvironment({
    TAP_BIND: `:${PORTS.tap}`,
    TAP_DATABASE_URL: "sqlite:///tmp/tap.db",
    TAP_RELAY_URL: PDS_URL,
    TAP_PLC_URL: PLC_URL,
  })
  .start();

const jetstreamRelay = createTcpServer((socket) => {
  socket.once("data", (head) => {
    if (head.toString().startsWith("GET /xrpc/com.atproto.sync.listHosts")) {
      const body = JSON.stringify({ hosts: [] });
      socket.end(
        `HTTP/1.1 200 OK\r\ncontent-type: application/json\r\ncontent-length: ${body.length}\r\nconnection: close\r\n\r\n${body}`,
      );
      return;
    }
    const pds = connect(PORTS.pds, "localhost", () => {
      pds.write(head);
      socket.pipe(pds).pipe(socket);
    });
    pds.on("error", () => socket.destroy());
    socket.on("error", () => pds.destroy());
  });
}).listen(PORTS.jetstreamRelay);

const jetstreamPlc = createServer(async (req, res) => {
  const plcRes = await fetch(`${PLC_URL}${req.url}`);
  if (!plcRes.ok || !req.url?.startsWith("/did:plc:")) {
    res.writeHead(plcRes.status).end(await plcRes.text());
    return;
  }
  const doc = await plcRes.json();
  const key = getKey(doc);
  res.writeHead(200, { "content-type": "application/json" }).end(
    JSON.stringify({
      ...doc,
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/multikey/v1",
      ],
      verificationMethod: [
        {
          id: `${doc.id}#atproto`,
          type: "Multikey",
          controller: doc.id,
          publicKeyMultibase: key?.replace("did:key:", ""),
        },
      ],
    }),
  );
}).listen(PORTS.jetstreamPlc);

const jetstream = await new GenericContainer(
  "ghcr.io/bluesky-social/jetstream:v0.4.6",
)
  .withNetworkMode("host")
  .withEnvironment({
    JETSTREAM_ADDR: `:${PORTS.jetstream}`,
    JETSTREAM_RELAY_URL: `http://localhost:${PORTS.jetstreamRelay}`,
    JETSTREAM_PLC_URL: `http://localhost:${PORTS.jetstreamPlc}`,
    JETSTREAM_DATA_DIR: "/tmp/jetstream",
  })
  .withWaitStrategy(Wait.forLogMessage(/steady-state consumer running/))
  .start();

const atblob = await new GenericContainer("ghcr.io/mkizka/atblob:0")
  .withNetworkMode("host")
  .withEnvironment({
    PORT: String(PORTS.blobProxy),
    PLC_DIRECTORY_URL: PLC_URL,
    DISABLE_SSRF_PROTECTION: "true",
  })
  .start();

process.stdout.write(
  "Test accounts: alice.test, bob.test, carol.test, dave.test, erin.test, frank.test, grace.test, heidi.test, ivan.test / password\n",
);

const app = spawn(process.argv.slice(2).join(" "), {
  shell: true,
  detached: true,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL,
    REDIS_URL,
    PLC_URL,
    ATPROTO_PLC_URL: PLC_URL,
    ATPROTO_HANDLE_RESOLVER_URL: PDS_URL,
  },
});

app.on("exit", async () => {
  await network.close();
  jetstreamRelay.close();
  jetstreamPlc.close();
  await Promise.all([
    tap.stop(),
    jetstream.stop(),
    atblob.stop(),
    redis.stop(),
    postgres.stop(),
  ]);
  await rm(tmp, { recursive: true, force: true });
  process.exit();
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    // detachedで起動したappはプロセスグループのリーダーなので、負のPIDでpnpmやturboなどの子孫ごと止める
    if (app.pid) process.kill(-app.pid, "SIGTERM");
  });
}
