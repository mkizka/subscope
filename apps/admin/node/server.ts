/* eslint-disable no-console */
import express from "express";

const BUILD_PATH = "../build/server/index.js";
const DEVELOPMENT = process.env.NODE_ENV === "development";
const PORT = Number.parseInt(process.env.PORT || "3000");

const app = express();

app.disable("x-powered-by");

if (DEVELOPMENT) {
  const viteDevServer = await import("vite").then((vite) =>
    vite.createServer({
      server: { middlewareMode: true },
    }),
  );
  app.use(viteDevServer.middlewares);
  app.use(async (req, res, next) => {
    try {
      const source = await viteDevServer.ssrLoadModule(
        "./app/server/inject.ts",
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return await source.app(req, res, next);
    } catch (error) {
      if (typeof error === "object" && error instanceof Error) {
        viteDevServer.ssrFixStacktrace(error);
      }
      next(error);
    }
  });
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
  );
  app.use(express.static("build/client", { maxAge: "1h" }));
  app.use(
    await import(BUILD_PATH).then((mod: { app: express.Express }) => mod.app),
  );
}

app.listen(PORT, () => {
  console.log(
    `Server is running on ${process.env.PUBLIC_URL} in ${process.env.NODE_ENV} mode`,
  );
});
