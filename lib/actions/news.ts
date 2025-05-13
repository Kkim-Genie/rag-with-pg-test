import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { generateEmbeddings } from "../ai/embedding";
import { db } from "../db";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";
import { insertNewsSchema, NewNewsParams, news } from "../db/schema/news";

export const CreateNews = async (input: NewNewsParams) => {
  try {
    const { date, title, link, content, company, keywords } =
      insertNewsSchema.parse(input);

    // Check for existing news with the same date and title
    const safeDate = date ?? "";
    const safeTitle = title ?? "";
    const existing = await db
      .select()
      .from(news)
      .where(and(eq(news.date, safeDate), eq(news.title, safeTitle)));
    if (existing.length > 0) {
      return "duplicate date and title";
    }

    const mergedContent = `title:${title}\nlink:${link}\ndate:${date}\n${
      company ? `company name:${company}\n` : ""
    }content:${content}`;
    //감성이 중립일 경우 필터링

    const embededTitle = await generateEmbeddings(title, false);
    const embedded = await generateEmbeddings(mergedContent, false);

    const [newNews] = await db
      .insert(news)
      .values({ date, title, link, content, company, keywords })
      .returning();

    await db.insert(embeddingsTable).values(
      embedded.map((embedding) => ({
        titleEmbedding: embededTitle[0].embedding,
        date,
        originId: newNews.id,
        originType: "news",
        ...embedding,
      }))
    );

    return "News successfully created and embedded.";
  } catch (error) {
    console.log(error);
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};
