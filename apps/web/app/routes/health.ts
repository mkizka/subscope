import { di } from "@/app/server/di";

export const loader = () => {
  return Response.json({
    status: "ok",
    env: {
      NODE_ENV: di.env.NODE_ENV,
      LOG_LEVEL: di.env.LOG_LEVEL,
      PORT: di.env.PORT,
      PUBLIC_URL: di.env.PUBLIC_URL,
    },
  });
};
