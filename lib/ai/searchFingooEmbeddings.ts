import { cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "../db";
import { dailyMarketCondition } from "../db/schema/daily_market_condition";
import { fingooEmbeddings } from "../db/schema/fingoo_embeddings";
import { generateEmbedding } from "./embedding";

export const searchFingooEmbeddings = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(
    fingooEmbeddings.embedding,
    userQueryEmbedded
  )})`;
  const similarGuides = await db
    .select({ name: fingooEmbeddings.content, similarity })
    .from(fingooEmbeddings)
    .where(gt(similarity, 0.5))
    .orderBy((t) => desc(t.similarity))
    .limit(4);
  return similarGuides;
};
