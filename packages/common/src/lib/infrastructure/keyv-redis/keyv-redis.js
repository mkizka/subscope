import KeyvRedis from "@keyv/redis";
export const createKeyvRedis = (redisUrl) => {
  const url = new URL(redisUrl);
  const family = url.searchParams.get("family");
  // @keyv/redisが内部で@redis/clientを使用している影響でURLの?family=0が反映されない
  // 代わりにパースしてオプションで渡す
  const redisOptions = {
    url: redisUrl,
    socket: {
      family: family ? Number(family) : undefined,
    },
  };
  return new KeyvRedis(redisOptions);
};
