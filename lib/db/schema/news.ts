import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgSchema } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { nanoid } from "@/lib/utils";
import { aiSchema } from "../aiSchema";

export const news = aiSchema.table("news", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  title: text("title").notNull(),
  link: text("link"),
  date: text("date"),
  content: text("content").notNull(),
  company: text("company"),
  keywords: text("keywords").array().notNull(),

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

export const insertNewsSchema = createSelectSchema(news)
  .extend({})
  .extend({
    keywords: z.union([
      z.string().array(),
      z.string().transform((value) => [value]),
    ]),
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type NewNewsParams = z.infer<typeof insertNewsSchema>;
