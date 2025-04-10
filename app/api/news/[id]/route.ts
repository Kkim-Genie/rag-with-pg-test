import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { news } from "@/lib/db/schema/news";
import { embeddings } from "@/lib/db/schema/embeddings";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/resources/:id - 특정 리소스 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const newsList = await db
      .select()
      .from(news)
      .where(eq(news.id, id))
      .limit(1);

    if (newsList.length === 0) {
      return NextResponse.json({ error: "news not found" }, { status: 404 });
    }

    return NextResponse.json(newsList[0]);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // 리소스가 존재하는지 확인
    const existingNews = await db
      .select()
      .from(news)
      .where(eq(news.id, id))
      .limit(1);

    if (existingNews.length === 0) {
      return NextResponse.json({ error: "News not found" }, { status: 404 });
    }

    // 삭제
    await db.delete(news).where(eq(news.id, id));
    await db
      .delete(embeddings)
      .where(
        and(eq(embeddings.originId, id), eq(embeddings.originType, "news"))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting news:", error);
    return NextResponse.json(
      { error: "Failed to delete news" },
      { status: 500 }
    );
  }
}
