import { di } from "@/app/server/di";

export const loader = () => {
  return Response.json({
    status: "ok",
    env: {
      NODE_ENV: di.nodeEnv,
      LOG_LEVEL: di.logLevel,
      PORT: di.port,
      PUBLIC_URL: di.publicUrl,
    },
  });
};
