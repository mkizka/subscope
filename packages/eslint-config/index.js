import { mkizka } from "@mkizka/eslint-config";

const legacyRepositoryMethods = {
  IActorRepository:
    "exists|findByDid|findTrackedDidsWithoutBackfillStatus|updateBackfillStatus|upsert",
  IActorStatsRepository:
    "upsertFollowersCount|upsertFollowsCount|upsertPostsCount",
  IFeedItemRepository: "upsert",
  IFollowRepository:
    "findFolloweeDids|findFollowers|findFollows|isFollowedByAnySubscriber|upsert",
  IGeneratorRepository: "upsert",
  IInviteCodeRepository: "findAll|findByCode|markAsUsed",
  ILabelRepository: "upsert",
  ILikeRepository: "findMany|upsert",
  IListItemRepository: "upsert",
  IListRepository: "upsert",
  INotificationRepository: "createMany",
  IPostRepository: "exists|findReplyParentUri|upsert",
  IPostStatsRepository: "upsertMany",
  IProfileRepository: "exists|searchActors|upsert",
  IRecordRepository: "findByUri|upsert",
  IRepostRepository: "findRepostsByPost|upsert",
  ISubscriptionRepository:
    "count|countTrackedActors|existsByInviteCode|findFirst|findMany|findTrackedActors|isSubscriber|updateSeenAt|upsert",
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
