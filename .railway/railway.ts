import {
  defineRailway,
  github,
  image,
  postgres,
  preserve,
  project,
  redis,
  service,
  volume,
} from "railway/iac";

const region = "asia-southeast1-eqsg3a";

const app = (
  target: "appview" | "web" | "worker" | "ingester",
  watch: string[],
) => ({
  source: github("mkizka/subscope", { branch: "main" }),
  build: {
    watchPatterns: [
      `/apps/${target}/**/*`,
      "/packages/client/**/*",
      "/packages/common/**/*",
      ...watch,
      "pnpm-lock.yaml",
      "Dockerfile",
    ],
  },
  healthcheck: "/health",
  healthcheckTimeout: 60,
  replicas: { [region]: 1 },
});

const deploy = (cpu: number) => ({
  restartPolicyType: "ALWAYS" as const,
  limitOverride: { containers: { cpu, memoryBytes: 1_000_000_000 } },
});

export default defineRailway(() => {
  const db = postgres("Postgres", { region });
  const cache = redis("Redis", { region });

  const tapData = volume("tap-data", { region, sizeMB: 5000 });
  const tap = service("Tap", {
    source: image("ghcr.io/bluesky-social/indigo/tap:0.1"),
    replicas: { [region]: 1 },
    volumeMounts: { "/data": tapData },
    env: {
      TAP_DATABASE_URL: "sqlite:///data/tap.db",
      TAP_METRICS_LISTEN: ":6009",
    },
  });

  const atblob = service("ATBlob", {
    source: image("ghcr.io/mkizka/atblob:latest"),
    replicas: { [region]: 1 },
    domains: ["cdn.subsco.me"],
    env: {
      PORT: "8080",
      DID_CACHE: "redis",
      REDIS_URL: cache.env.REDIS_URL,
    },
  });

  const tapUrl = "http://${{Tap.RAILWAY_PRIVATE_DOMAIN}}:2480";

  const appview = service("Appview", {
    ...app("appview", ["/packages/db/**/*"]),
    preDeploy: "pnpm db:migrate",
    deploy: deploy(2),
    domains: ["appview.subsco.me"],
    env: {
      BUILD_TARGET: "appview",
      DATABASE_URL: db.env.DATABASE_URL,
      REDIS_URL: cache.env.REDIS_URL,
      PUBLIC_URL: "https://${{RAILWAY_PUBLIC_DOMAIN}}",
      BLOB_PROXY_URL: "https://${{ATBlob.RAILWAY_PUBLIC_DOMAIN}}",
    },
  });

  const web = service("Web", {
    ...app("web", ["/packages/db/**/*"]),
    preDeploy: "pnpm db:migrate",
    deploy: deploy(1),
    domains: ["alpha.subsco.me"],
    env: {
      BUILD_TARGET: "web",
      DATABASE_URL: db.env.DATABASE_URL,
      REDIS_URL: cache.env.REDIS_URL,
      PUBLIC_URL: "https://${{RAILWAY_PUBLIC_DOMAIN}}",
      APPVIEW_URL: "https://${{Appview.RAILWAY_PUBLIC_DOMAIN}}",
      COOKIE_SECRET: preserve(),
      PRIVATE_KEY_ES256_B64: preserve(),
    },
  });

  const worker = service("Worker", {
    ...app("worker", ["/packages/db/**/*"]),
    preDeploy: "pnpm db:migrate",
    deploy: { ...deploy(2), drainingSeconds: 60 },
    env: {
      BUILD_TARGET: "worker",
      DATABASE_URL: db.env.DATABASE_URL,
      REDIS_URL: cache.env.REDIS_URL,
      TAP_URL: tapUrl,
    },
  });

  const ingester = service("Ingester", {
    ...app("ingester", []),
    deploy: deploy(1),
    env: {
      BUILD_TARGET: "ingester",
      REDIS_URL: cache.env.REDIS_URL,
      TAP_URL: tapUrl,
    },
  });

  const prometheusData = volume("prometheus-data", { region, sizeMB: 2000 });
  const prometheus = service("Prometheus", {
    source: github("mkizka/subscope", {
      branch: "main",
      rootDirectory: "/.railway/prometheus",
    }),
    build: { watchPatterns: ["/.railway/prometheus/**/*"] },
    replicas: { [region]: 1 },
    volumeMounts: { "/prometheus": prometheusData },
  });

  const grafana = service("Grafana", {
    source: github("mkizka/subscope", {
      branch: "main",
      rootDirectory: "/.railway/grafana",
    }),
    build: { watchPatterns: ["/.railway/grafana/**/*"] },
    replicas: { [region]: 1 },
    networking: {
      serviceDomains: { "subscope-grafana.up.railway.app": { port: 3000 } },
    },
    env: {
      GF_SECURITY_ADMIN_PASSWORD: preserve(),
    },
  });

  return project("Subscope", {
    resources: [
      db,
      cache,
      tapData,
      tap,
      atblob,
      appview,
      web,
      worker,
      ingester,
      prometheusData,
      prometheus,
      grafana,
    ],
  });
});
