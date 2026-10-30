import { isPlainObject, type LexMap } from "@atproto/lex";

export const asLexMap = (value: unknown): LexMap => {
  if (isPlainObject(value)) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return value as LexMap;
  }
  throw new Error("Value is not an object");
};
