import { MeiliSearch } from "meilisearch";

export function meilisearchFactory(
  meilisearchHost: string,
  meilisearchApiKey?: string,
) {
  return new MeiliSearch({
    host: meilisearchHost,
    apiKey: meilisearchApiKey,
  });
}
meilisearchFactory.inject = ["meilisearchHost", "meilisearchApiKey"] as const;

export type MeilisearchClient = ReturnType<typeof meilisearchFactory>;
