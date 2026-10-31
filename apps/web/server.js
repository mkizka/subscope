import { createRequestHandler } from "@react-router/express";
import express from "express";
import morgan from "morgan";

const app = express();
app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(
  "/assets",
  express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
);
app.use(express.static("build/client", { maxAge: "1h" }));
app.use(morgan("tiny"));
app.all(
  "/{*splat}",
  createRequestHandler({ build: await import("./build/server/index.js") }),
);

app.listen(Number(process.env.PORT ?? 3000));
