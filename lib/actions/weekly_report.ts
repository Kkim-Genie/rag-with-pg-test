import { generateEmbeddings } from "../ai/embedding";
import { db } from "../db";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";
import {
  insertWeeklyReportSchema,
  NewWeeklyReportParams,
  weeklyReport,
} from "../db/schema/weekly_report";

export const CreateWeeklyReport = async (input: NewWeeklyReportParams) => {
  try {
    const { start_date, end_date, content, market_analysis_ids, news_ids } =
      insertWeeklyReportSchema.parse(input);

    const [newWeeklyReport] = await db
      .insert(weeklyReport)
      .values({ start_date, end_date, content, market_analysis_ids, news_ids })
      .returning();

    const mergedContent = `title:${start_date}~${end_date} weekly report\ncontent:${content}`;

    const embeddings = await generateEmbeddings(mergedContent, false);
    await db.insert(embeddingsTable).values(
      embeddings.map((embedding) => ({
        date: start_date,
        originId: newWeeklyReport.id,
        originType: "weekly_report",
        ...embedding,
      }))
    );

    return "WeeklyReport successfully created and embedded.";
  } catch (error) {
    console.log(error);
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};
