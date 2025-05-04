import { db } from "@/lib/db";
import { news } from "@/lib/db/schema/news";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const youtubeNews = await db
      .select()
      .from(news)
      .where(eq(news.company, "youtube_futuresnow"))
      .orderBy(desc(news.date))
      .limit(1);
    return NextResponse.json(youtubeNews[0].date);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}
