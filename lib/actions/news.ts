import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { generateEmbeddings } from "../ai/embedding";
import { db } from "../db";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";
import { insertNewsSchema, NewNewsParams, news } from "../db/schema/news";

export const CreateNews = async (input: NewNewsParams) => {
  try {
    const { date, title, link, content, company } =
      insertNewsSchema.parse(input);

    const mergedContent = `title:${title}\nlink:${link}\ndate:${date}\n${
      company ? `company name:${company}\n` : ""
    }content:${content}`;

    const embedded = await generateEmbeddings(mergedContent, false);

    const similarity = sql<number>`1 - (${cosineDistance(
      embeddingsTable.embedding,
      embedded[0].embedding
    )})`;
    const similarGuides = await db
      .select({ name: embeddingsTable.content, similarity })
      .from(embeddingsTable)
      .where(and(gt(similarity, 0.7), eq(embeddingsTable.date, date ?? "")))
      .orderBy((t) => desc(t.similarity));
    if (similarGuides.length > 0) {
      return "similar content already exist";
    }

    const [newNews] = await db
      .insert(news)
      .values({ date, title, link, content, company })
      .returning();

    await db.insert(embeddingsTable).values(
      embedded.map((embedding) => ({
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
