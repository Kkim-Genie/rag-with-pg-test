import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { findRelevantContent } from "@/lib/ai/embedding";
import dayjs from "dayjs";
import { searchNewsByDate } from "@/lib/ai/searchNews";
import { searchMarketConditionByDate } from "@/lib/ai/searchMarketCondition";
import { searchFingooEmbeddings } from "@/lib/ai/searchFingooEmbeddings";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

function isValidDateFormat(dateStr: string) {
  // 1. 정규식으로 기본 형식 검사 (간단한 사전 검증)
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }

  // 2. dayjs로 실제 날짜 유효성 검사
  // strict: true 옵션으로 엄격한 형식 검사
  // 예: '2023-02-31'은 형식은 맞지만 2월에 31일이 없으므로 유효하지 않은 날짜
  const date = dayjs(dateStr, "YYYY-MM-DD", true);
  return date.isValid();
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages,
    system: `오늘의 날짜:${dayjs().format("YYYY-MM-DD")}
    You are a helpful assistant. 
    If there is a link to the website in the answer, wrap it with <link></link>
    If the question is not related with economy do not use tools.
    Otherwise, first check your tool except getInformation. 
    If there is no reasonable tools then use knowledge base before answering about economy questions.`,
    tools: {
      getNews: tool({
        description: `get news articles from a specific date`,
        parameters: z.object({
          question: z.string().describe("the users question"),
          date: z.string().describe("date of format YYYY-MM-DD or YYYY-MM"),
        }),
        execute: async ({ question, date }) => {
          if (!isValidDateFormat(date)) {
            return findRelevantContent(question);
          }
          const data = await searchNewsByDate(date);
          return data;
        },
      }),
      getMarketCondition: tool({
        description: `get market condition from a specific date`,
        parameters: z.object({
          question: z.string().describe("the users question"),
          date: z.string().describe("date of format YYYY-MM-DD or YYYY-MM"),
        }),
        execute: async ({ question, date }) => {
          if (!isValidDateFormat(date)) {
            return findRelevantContent(question);
          }
          const data = await searchMarketConditionByDate(date);
          return data;
        },
      }),
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        parameters: z.object({
          question: z.string().describe("the users question"),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
      getFingooInformation: tool({
        description: `fingoo(핀구)에 대한 정보 및 해당 서비스의 각종 기능과 관련된 질문에 대한 답변을 제공합니다`,
        parameters: z.object({
          question: z.string().describe("the users question"),
        }),
        execute: async ({ question }) => searchFingooEmbeddings(question),
      }),
    },
  });

  return result.toDataStreamResponse();
}
