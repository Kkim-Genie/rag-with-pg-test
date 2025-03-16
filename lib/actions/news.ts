import { generateEmbeddings } from "../ai/embedding";
import { db } from "../db";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";
import { insertNewsSchema, NewNewsParams, news } from "../db/schema/news";

export const CreateNews = async (input: NewNewsParams) => {
  try {
    const { date, title, link, content } = insertNewsSchema.parse(input);

    const [newNews] = await db
      .insert(news)
      .values({ date, title, link, content })
      .returning();

    const mergedContent = `title:${title}\nlink:${link}\ndate:${date}\ncontent:${content}`;

    const embeddings = await generateEmbeddings(mergedContent, false);
    await db.insert(embeddingsTable).values(
      embeddings.map((embedding) => ({
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
