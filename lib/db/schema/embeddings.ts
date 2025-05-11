import { nanoid } from "@/lib/utils";
import { index, pgSchema, text, varchar, vector } from "drizzle-orm/pg-core";
import { aiSchema } from "../aiSchema";

export const embeddings = aiSchema.table(
  "embeddings",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    date: text("date"),
    originId: varchar("origin_id", { length: 191 }).notNull(),
    originType: varchar("origin_type", { length: 50 }).notNull(), // 'daily_market_condition' 또는 'news'를 저장
    content: text("content").notNull(),
    titleEmbedding: vector("title_embedding", { dimensions: 1536 }).notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  },
  (table) => ({
    embeddingIndex: index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);
