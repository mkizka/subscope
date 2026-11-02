import { mkizka } from "@mkizka/eslint-config";

const legacyRepositoryMethods = {
  IActorRepository:
    "exists|findTrackedDidsWithoutBackfillStatus|updateBackfillStatus",
  IActorStatsRepository:
    "upsertFollowersCount|upsertFollowsCount|upsertPostsCount",
  IFeedItemRepository: "upsert",
  IFollowRepository: "isFollowedByAnySubscriber|upsert",
  IGeneratorRepository: "upsert",
  IInviteCodeRepository: "findByCode|markAsUsed",
  ILabelRepository: "upsert",
  ILikeRepository: "findMany|upsert",
  IListItemRepository: "upsert",
  IListRepository: "upsert",
  INotificationRepository: "createMany",
  IPostRepository: "upsert",
  IPostStatsRepository: "upsertMany",
  IProfileRepository: "upsert",
  IRecordRepository: "findByUri|upsert",
  IRepostRepository: "upsert",
  ISubscriptionRepository:
    "count|countTrackedActors|findMany|findTrackedActors|isSubscriber|upsert",
};

const repositoryMethodRule = (interfaceName, allowed) => ({
  selector: `TSInterfaceDeclaration[id.name=${interfaceName}] > TSInterfaceBody > [key.name!=/^(${allowed})$/]`,
  message:
    "リポジトリのメソッドはfind・save・deleteのみにしてください。読み取りはクエリサービスに書いてください(docs/dev/repository-and-query.md)。",
});

const legacyNames = Object.keys(legacyRepositoryMethods).join("|");

export const config = [
  ...mkizka,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.property.name=/^(service|replaceService)$/] > ArrowFunctionExpression",
          message:
            "DIの配線にアロー関数を書かないでください。必ずクラスを作成し、asClassArgsで登録してください。",
        },
        repositoryMethodRule(
          `/^(?!(${legacyNames})$)I\\w*Repository$/`,
          "find|save|delete",
        ),
        ...Object.entries(legacyRepositoryMethods).map(([name, methods]) =>
          repositoryMethodRule(`"${name}"`, `find|save|delete|${methods}`),
        ),
      ],
    },
  },
  {
    files: ["**/*.in-memory.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    files: ["**/shared/registry.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!@gyaku/di$|@repo/|\\.)",
              message:
                "DIの配線でライブラリを直接使わないでください。自前のinterfaceを実装したクラスでラップしてください(例: LabelCursorStore)。",
            },
          ],
        },
      ],
    },
  },
];
