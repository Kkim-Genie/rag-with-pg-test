import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { news } from "../db/schema/news";

export const searchNewsByDate = async (date: string) => {
  const allNews = await db
    .select()
    .from(news)
    .where(eq(news.date, date))
    .orderBy(desc(news.createdAt));
  return allNews;
};
