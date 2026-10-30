import { execSync, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { TestNetworkNoAppView } from "@atproto/dev-env";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer } from "testcontainers";

const PORTS = {
  plc: 2582,
  pds: 2583,
  tap: 2480,
  atblob: 3002,
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

for (const name of ["alice", "bob", "carol"]) {
  await network.pds.getAgent().createAccount({
    handle: `${name}.test`,
    email: `${name}@example.com`,
    password: "password",
  });
}

const [tap, atblob] = await Promise.all([
  new GenericContainer("ghcr.io/bluesky-social/indigo/tap:0.1")
    .withNetworkMode("host")
    .withEnvironment({
      TAP_BIND: `:${PORTS.tap}`,
      TAP_DATABASE_URL: "sqlite:///tmp/tap.db",
      TAP_RELAY_URL: PDS_URL,
      TAP_PLC_URL: PLC_URL,
    })
    .start(),
  new GenericContainer("ghcr.io/mkizka/atblob:latest")
    .withNetworkMode("host")
    .withEnvironment({
      PORT: String(PORTS.atblob),
      PLC_DIRECTORY_URL: PLC_URL,
    })
    .start(),
]);

process.stdout.write("Test accounts: alice.test, bob.test / password\n");

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
  await Promise.all([tap.stop(), atblob.stop(), redis.stop(), postgres.stop()]);
  await rm(tmp, { recursive: true, force: true });
  process.exit();
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    // detachedで起動したappはプロセスグループのリーダーなので、負のPIDでpnpmやturboなどの子孫ごと止める
    if (app.pid) process.kill(-app.pid, "SIGTERM");
  });
}
