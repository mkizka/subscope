export type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import { env } from "./env.js";

export const createPrisma = (
  prismaOptions?: ConstructorParameters<typeof PrismaClient>[0],
) => {
  const libsql = createClient({
    url: env.LIBSQL_DATABASE_URL,
  });
  const adapter = new PrismaLibSQL(libsql);
  return new PrismaClient({ adapter, ...prismaOptions });
};
