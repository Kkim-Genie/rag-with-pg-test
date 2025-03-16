import { createMarketCondition } from "@/lib/actions/daily_market_condition";
import { db } from "@/lib/db";
import { dailyMarketCondition } from "@/lib/db/schema/daily_market_condition";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allNews = await db
      .select()
      .from(dailyMarketCondition)
      .orderBy(desc(dailyMarketCondition.createdAt));
    return NextResponse.json(allNews);
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
    const rows: { date: string; content: string }[] = await req.json();

    for (const row of rows) {
      const { date, content } = row;
      const msg = await createMarketCondition({
        date,
        content,
      });
    }
    // 성공 응답
    return NextResponse.json(
      {
        success: true,
        // message: msg,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("시황 등록 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
