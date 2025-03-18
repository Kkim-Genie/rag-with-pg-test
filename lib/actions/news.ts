import { generateEmbeddings } from "../ai/embedding";
import { db } from "../db";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";
import { insertNewsSchema, NewNewsParams, news } from "../db/schema/news";

export const CreateNews = async (input: NewNewsParams) => {
  try {
    const { date, title, link, content, company } =
      insertNewsSchema.parse(input);

    const [newNews] = await db
      .insert(news)
      .values({ date, title, link, content, company })
      .returning();

    const mergedContent = `title:${title}\nlink:${link}\ndate:${date}\n${
      company ? `company name:${company}\n` : ""
    }content:${content}`;

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
