import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { dailyMarketCondition } from "../db/schema/daily_market_condition";

export const searchMarketConditionByDate = async (date: string) => {
  const allNews = await db
    .select()
    .from(dailyMarketCondition)
    .where(eq(dailyMarketCondition.date, date))
    .orderBy(desc(dailyMarketCondition.createdAt));
  return allNews;
};
