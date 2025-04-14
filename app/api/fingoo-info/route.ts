import { fingooEmbeddings } from "@/lib/db/schema/fingoo_embeddings";
import { db } from "@/lib/db";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { CreateFingooEmbeddings } from "@/lib/actions/fingoo_embeddings";

export async function GET() {
  try {
    console.log("check");
    const allFingooEmbeddings = await db
      .select()
      .from(fingooEmbeddings)
      .orderBy(desc(fingooEmbeddings.createdAt));
    return NextResponse.json(allFingooEmbeddings);
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
    const { content }: { content: string } = await req.json();

    const msg = await CreateFingooEmbeddings({
      content,
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

export async function DELETE() {
  try {
    await db.delete(fingooEmbeddings).execute();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting fingoo info:", error);
    return NextResponse.json(
      { error: "Failed to delete fingoo info" },
      { status: 500 }
    );
  }
}
