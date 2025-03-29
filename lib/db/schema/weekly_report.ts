import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgSchema } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { nanoid } from "@/lib/utils";
import { aiSchema } from "..";

export const weeklyReport = aiSchema.table("weekly_report", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  start_date: text("start_date").notNull(),
  end_date: text("end_date").notNull(),
  content: text("content").notNull(),
  market_analysis_ids: text("market_analysis_ids").array().notNull(),
  news_ids: text("news_ids").array().notNull(),

  created_at: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updated_at: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

const baseSchema = createSelectSchema(weeklyReport);

export const insertWeeklyReportSchema = baseSchema
  .extend({
    // Ensure these are always arrays
    market_analysis_ids: z.union([
      z.string().array(),
      z.string().transform((value) => [value]),
    ]),
    news_ids: z.union([
      z.string().array(),
      z.string().transform((value) => [value]),
    ]),
  })
  .omit({
    id: true,
    created_at: true,
    updated_at: true,
  });

export type NewWeeklyReportParams = z.infer<typeof insertWeeklyReportSchema>;
