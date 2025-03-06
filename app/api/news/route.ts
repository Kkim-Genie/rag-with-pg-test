// app/api/news/add/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resources, insertResourceSchema } from "@/lib/db/schema/resources";
import { ZodError } from "zod";
import { createResource } from "@/lib/actions/resources";

export async function GET() {
  try {
    const allResources = await db
      .select()
      .from(resources)
      .orderBy(resources.createdAt, "desc");
    return NextResponse.json(allResources);
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
    const body = await req.json();
    const { title, content, link, date } = body;

    const mergedContent = `title: ${title}
        date: ${date}
        link: ${link}
        content: ${content}
    `;
    const msg = await createResource({
      title,
      date,
      link,
      content: mergedContent,
    });
    // 성공 응답
    return NextResponse.json(
      {
        success: true,
        message: msg,
      },
      { status: 201 }
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
