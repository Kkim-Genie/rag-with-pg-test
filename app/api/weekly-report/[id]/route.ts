import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { embeddings } from "@/lib/db/schema/embeddings";
import { weeklyReport } from "@/lib/db/schema/weekly_report";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/resources/:id - 특정 리소스 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const reports = await db
      .select()
      .from(weeklyReport)
      .where(eq(weeklyReport.id, id))
      .limit(1);

    if (reports.length === 0) {
      return NextResponse.json({ error: "report not found" }, { status: 404 });
    }

    const report = reports[0];

    const embeded = await db
      .select()
      .from(embeddings)
      .where(
        and(
          eq(embeddings.originId, report.id),
          eq(embeddings.originType, "weekly_report")
        )
      );

    return NextResponse.json({ ...report, embeded: embeded.length > 0 });
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
    const existingReport = await db
      .select()
      .from(weeklyReport)
      .where(eq(weeklyReport.id, id))
      .limit(1);

    if (existingReport.length === 0) {
      return NextResponse.json({ error: "report not found" }, { status: 404 });
    }

    // 삭제
    await db.delete(weeklyReport).where(eq(weeklyReport.id, id));
    await db
      .delete(embeddings)
      .where(
        and(
          eq(embeddings.originId, id),
          eq(embeddings.originType, "weekly_report")
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
