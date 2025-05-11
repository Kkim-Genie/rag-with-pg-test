import { nanoid } from "@/lib/utils";
import {
  index,
  pgSchema,
  text,
  timestamp,
  varchar,
  vector,
} from "drizzle-orm/pg-core";
import { aiSchema } from "../aiSchema";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const fingooEmbeddings = aiSchema.table(
  "fingoo_embeddings",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    fingooEmbeddingIndex: index("fingooEmbeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);

export const insertFingooEmbeddingsSchema = z.object({
  content: z.string(),
});

export type NewFingooEmbeddingsParams = z.infer<
  typeof insertFingooEmbeddingsSchema
>;
