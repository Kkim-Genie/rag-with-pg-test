// app/api/news/add/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { desc } from "drizzle-orm";
import { weeklyReport } from "@/lib/db/schema/weekly_report";
import { CreateWeeklyReport } from "@/lib/actions/weekly_report";

export async function GET() {
  try {
    const reports = await db
      .select()
      .from(weeklyReport)
      .orderBy(desc(weeklyReport.created_at));
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // 요청 본문 파싱
    const data: {
      start_date: string;
      end_date: string;
      content: string;
      market_analysis_ids: string[];
      news_ids: string[];
    } = await req.json();
    const { start_date, end_date, content, market_analysis_ids, news_ids } =
      data;

    await CreateWeeklyReport({
      start_date,
      end_date,
      content,
      market_analysis_ids,
      news_ids,
    });

    // 성공 응답
    return NextResponse.json(
      {
        success: true,
        // message: msg,
      },
      { status: 201 }
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
