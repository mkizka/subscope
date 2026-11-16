import { syntaxRule } from "../syntax-rule.js";

const noUseCaseImport = {
  meta: { type: "problem", schema: [] },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (/-use-case(\.js)?$/.test(node.source.value)) {
          context.report({
            node,
            message:
              "usecaseから別のusecaseを呼ばないでください。共通の処理はserviceに切り出してください。",
          });
        }
      },
    };
  },
};

export default {
  rules: {
    "no-use-case-import": noUseCaseImport,
    "repository-methods": syntaxRule(
      "TSInterfaceDeclaration[id.name=/^I\\w*Repository$/] > TSInterfaceBody > [key.name!=/^(find|save|delete)$/]",
      "リポジトリのメソッドはfind・save・deleteのみにしてください。読み取りはクエリサービスに書いてください(docs/dev/repository-and-query.md)。",
    ),
    "use-case-execute-only": syntaxRule(
      "ClassDeclaration[id.name=/UseCase$/] > ClassBody > MethodDefinition[kind!='constructor'][key.type!='PrivateIdentifier'][accessibility!='private'][accessibility!='protected'][key.name!='execute'], TSInterfaceDeclaration[id.name=/^I\\w*UseCase$/] > TSInterfaceBody > [key.name!='execute']",
      "usecaseの公開メソッドはexecuteのみにしてください。",
    ),
    "execute-only-in-use-case": syntaxRule(
      "ClassDeclaration[id.name!=/UseCase$/] > ClassBody > MethodDefinition[key.name='execute']",
      "executeはusecaseだけのメソッド名です。別の名前にしてください。",
    ),
  },
};
