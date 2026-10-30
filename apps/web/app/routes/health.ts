import { env } from "@/app/server/shared/env";

export const loader = () => {
  return Response.json({
    status: "ok",
    env: {
      NODE_ENV: env.NODE_ENV,
      LOG_LEVEL: env.LOG_LEVEL,
      PORT: env.PORT,
      PUBLIC_URL: env.PUBLIC_URL,
    },
  });
};
