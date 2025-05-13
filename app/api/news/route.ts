// app/api/news/add/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z, ZodError } from "zod";
import { CreateNews } from "@/lib/actions/news";
import { news } from "@/lib/db/schema/news";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allNews = await db
      .select()
      .from(news)
      .orderBy(desc(news.date), desc(news.createdAt));
    return NextResponse.json(allNews);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

const NewsItemSchema = z.object({
  date: z.string().nonempty("날짜는 필수 항목입니다"),
  title: z.string().nonempty("제목은 필수 항목입니다"),
  link: z.string().url("유효한 URL을 입력해주세요"),
  content: z.string().nonempty("내용은 필수 항목입니다"),
  company: z.string().optional(),
  keywords: z.union([
    z.array(z.string()), // 이미 배열인 경우
    z.string().transform((str) => str.split(",").map((item) => item.trim())), // 문자열인 경우 배열로 변환
  ]),
});

const NewsArraySchema = z.array(NewsItemSchema);

export async function POST(req: Request) {
  try {
    // 요청 본문 파싱
    const body = await req.json();
    const result = NewsArraySchema.safeParse(body);

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

    const rows = result.data;
    const promises = rows.map(async (row, index) => {
      const { date, title, link, content, company, keywords } = row;
      return await CreateNews({
        date,
        title,
        link,
        content,
        company: company ?? null,
        keywords,
      });
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(
      (item) => item === "News successfully created and embedded."
    ).length;
    const existCount = results.filter(
      (item) =>
        item === "similar content already exist" ||
        item === "duplicate date and title"
    ).length;
    // 성공 응답
    return NextResponse.json(
      {
        total: results.length,
        success: successCount,
        exist: existCount,
        error: results.length - successCount - existCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("뉴스 등록 오류:", error);

    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
