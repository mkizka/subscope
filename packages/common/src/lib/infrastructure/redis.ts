import { createClient } from "redis";

export type RedisClient = ReturnType<typeof createClient>;

export const redisFactory = (redisUrl: string) => {
  const client = createClient({ url: redisUrl });
  void client.connect();
  return client;
};
redisFactory.inject = ["redisUrl"] as const;
