// app/api/news/add/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { weeklyReport } from "@/lib/db/schema/weekly_report";
import { CreateWeeklyReport } from "@/lib/actions/weekly_report";
import { z } from "zod";
import { generateEmbeddings } from "@/lib/ai/embedding";
import { embeddings as embeddingsTable } from "@/lib/db/schema/embeddings";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 요청 본문 파싱
    const { id } = params;

    const reports = await db
      .select()
      .from(weeklyReport)
      .where(eq(weeklyReport.id, id));

    if (reports.length === 0) {
      return NextResponse.json({ error: "report not found" }, { status: 404 });
    }

    const report = reports[0];

    const mergedContent = `title:${report.start_date}~${report.end_date} weekly report\ncontent:${report.content}`;

    const embededTitle = await generateEmbeddings(
      `${report.start_date}~${report.end_date} weekly report`
    );
    const embeddings = await generateEmbeddings(mergedContent, false);

    await db.insert(embeddingsTable).values({
      titleEmbedding: embededTitle[0].embedding,
      content: embeddings[0].content,
      embedding: embeddings[0].embedding,
      originId: id,
      originType: "weekly_report",
      date: report.start_date,
    });

    // 성공 응답
    return NextResponse.json(
      {
        success: true,
        // message: msg,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("위클리 보고서 등록 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
