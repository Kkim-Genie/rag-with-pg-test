// app/api/news/add/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ZodError } from "zod";
import { CreateNews } from "@/lib/actions/news";
import { news } from "@/lib/db/schema/news";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allNews = await db.select().from(news).orderBy(desc(news.createdAt));
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
    const rows: {
      date: string;
      title: string;
      link: string;
      content: string;
      company: string | undefined;
    }[] = await req.json();

    const promises = rows.map(async (row, index) => {
      const { date, title, link, content, company } = row;
      return await CreateNews({
        date,
        title,
        link,
        content,
        company: company ?? null,
      });
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(
      (item) => item === "News successfully created and embedded."
    ).length;
    const existCount = results.filter(
      (item) => item === "similar content already exist"
    ).length;
    const existTitleCount = results.filter(
      (item) => item === "similar title already exist"
    ).length;
    // 성공 응답
    return NextResponse.json(
      {
        total: results.length,
        success: successCount,
        exist: existCount,
        existTitle: existTitleCount,
        error: results.length - successCount - existCount,
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
