import "dotenv/config";
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as news from "./schema/news";
import * as embeddings from "./schema/embeddings";
import * as weekly_report from "./schema/weekly_report";
import * as fingoo_embeddings from "./schema/fingoo_embeddings";
import * as daily_market_condition from "./schema/daily_market_condition";
import { aiSchema } from "./aiSchema";

const connectionString = process.env.DATABASE_URL;

const schema = {
  ...news,
  ...embeddings,
  ...weekly_report,
  ...fingoo_embeddings,
  ...daily_market_condition,
};

const drizzleClient = drizzle(postgres(connectionString!, { prepare: false }), {
  schema,
});

declare global {
  // eslint-disable-next-line no-var
  var database: PostgresJsDatabase<typeof schema> | undefined;
}

export const db = global.database || drizzleClient;
if (process.env.NODE_ENV !== "production") global.database = db;
