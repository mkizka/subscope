import type {
  LoggerManager,
  MeilisearchClient,
} from "@repo/common/infrastructure";

export interface MeilisearchIndexDefinition {
  name: string;
  primaryKey: string;
  searchableAttributes: string[];
}

export const MEILISEARCH_INDEX_DEFINITIONS: MeilisearchIndexDefinition[] = [
  {
    name: "posts",
    primaryKey: "id",
    searchableAttributes: ["text"],
  },
];

export class MeilisearchMigrator {
  private readonly logger;

  constructor(
    private meilisearch: MeilisearchClient,
    loggerManager: LoggerManager,
  ) {
    this.logger = loggerManager.createLogger("MeilisearchMigrator");
  }
  static readonly inject = ["meilisearch", "loggerManager"] as const;

  async migrate(): Promise<void> {
    this.logger.info("Starting Meilisearch migration");

    for (const indexDef of MEILISEARCH_INDEX_DEFINITIONS) {
      await this.createIndexIfNotExists(indexDef);
    }

    this.logger.info("Meilisearch migration completed");
  }

  private async createIndexIfNotExists(
    indexDef: MeilisearchIndexDefinition,
  ): Promise<void> {
    try {
      const index = this.meilisearch.index(indexDef.name);
      await index.getStats();
      this.logger.info(`Index '${indexDef.name}' already exists`);
    } catch (error) {
      this.logger.info(`Creating index '${indexDef.name}'`);
      await this.meilisearch.createIndex(indexDef.name, {
        primaryKey: indexDef.primaryKey,
      });

      const index = this.meilisearch.index(indexDef.name);
      await index.updateSearchableAttributes(indexDef.searchableAttributes);
      this.logger.info(`Index '${indexDef.name}' created successfully`);
    }
  }
}
