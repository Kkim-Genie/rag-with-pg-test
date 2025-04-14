// app/api/news/add/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { weeklyReport } from "@/lib/db/schema/weekly_report";
import { CreateWeeklyReport } from "@/lib/actions/weekly_report";
import { z } from "zod";
import { embeddings } from "@/lib/db/schema/embeddings";

export async function GET() {
  try {
    const reports = await db
      .select()
      .from(weeklyReport)
      .orderBy(desc(weeklyReport.start_date));
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

const WeeklyReportSchema = z
  .object({
    start_date: z
      .string()
      .nonempty("시작 날짜는 필수 항목입니다")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD 형식이어야 합니다"),
    end_date: z
      .string()
      .nonempty("종료 날짜는 필수 항목입니다")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD 형식이어야 합니다"),
    content: z.string().nonempty("내용은 필수 항목입니다"),
    market_analysis_ids: z
      .array(z.string())
      .nonempty("시장 분석 ID는 최소 하나 이상 필요합니다"),
    news_ids: z
      .array(z.string())
      .nonempty("뉴스 ID는 최소 하나 이상 필요합니다"),
  })
  .refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
    message: "시작 날짜는 종료 날짜보다 이전이거나 같아야 합니다",
    path: ["start_date"],
  });

export async function POST(req: Request) {
  try {
    // 요청 본문 파싱
    const body = await req.json();

    // Zod를 이용한 데이터 검증
    const result = WeeklyReportSchema.safeParse(body);

    if (!result.success) {
      // 유효성 검사 실패 시 오류 응답
      return NextResponse.json(
        {
          success: false,
          message: "데이터 형식이 올바르지 않습니다",
          errors: result.error.format(),
        },
        { status: 400 }
      );
    }

    const { start_date, end_date, content, market_analysis_ids, news_ids } =
      result.data;

    await CreateWeeklyReport({
      start_date,
      end_date,
      content,
      market_analysis_ids,
      news_ids,
    });

    await db
      .delete(embeddings)
      .where(
        and(
          gte(
            sql`TO_DATE(${embeddings.date}, 'YYYY-MM-DD')`,
            sql`TO_DATE(${start_date}, 'YYYY-MM-DD')`
          ),
          lte(
            sql`TO_DATE(${embeddings.date}, 'YYYY-MM-DD')`,
            sql`TO_DATE(${end_date}, 'YYYY-MM-DD')`
          )
        )
      );

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
