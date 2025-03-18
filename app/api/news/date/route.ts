import { db } from "@/lib/db";
import { embeddings } from "@/lib/db/schema/embeddings";
import { news } from "@/lib/db/schema/news";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") ?? "";
    const company = url.searchParams.get("date") ?? null;

    const conditions = [];

    if (date) {
      conditions.push(eq(news.date, date));
    }

    if (company) {
      conditions.push(eq(news.company, company));
    }

    // Create the query with all applicable conditions
    const allNews = await db
      .select()
      .from(news)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(news.createdAt));

    return NextResponse.json(allNews);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // 요청 본문에서 삭제할 단일 날짜 추출
    const { date } = await req.json();

    if (!date || typeof date !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "삭제할 날짜를 문자열 형태로 제공해주세요",
        },
        { status: 400 }
      );
    }

    const recordsToDelete = await db
      .select({ id: news.id })
      .from(news)
      .where(eq(news.date, date));

    // 해당 날짜의 모든 레코드 삭제
    // const result = await db.delete(news).where(eq(news.date, date));
    for (const row of recordsToDelete) {
      await db
        .delete(embeddings)
        .where(
          and(
            eq(embeddings.originId, row.id),
            eq(embeddings.originType, "news")
          )
        );
    }

    return NextResponse.json(
      {
        success: true,
        message: `${date} 날짜의 데이터가 삭제되었습니다`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("시황 삭제 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
