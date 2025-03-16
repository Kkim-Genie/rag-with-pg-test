import { generateEmbeddings } from "../ai/embedding";
import { db } from "../db";
import {
  dailyMarketCondition,
  insertMarketConditonSchema,
  NewMarketConditionParams,
} from "../db/schema/daily_market_condition";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";

export const createMarketCondition = async (
  input: NewMarketConditionParams
) => {
  try {
    const { date, content } = insertMarketConditonSchema.parse(input);

    const [marketCondition] = await db
      .insert(dailyMarketCondition)
      .values({ date, content })
      .returning();

    const embeddings = await generateEmbeddings(content, false);
    await db.insert(embeddingsTable).values(
      embeddings.map((embedding) => ({
        date,
        originId: marketCondition.id,
        originType: "daily_market_condition",
        ...embedding,
      }))
    );

    return "Market Condition successfully created and embedded.";
  } catch (error) {
    console.log(error);
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};
