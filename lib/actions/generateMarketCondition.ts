"use server";

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";

export async function generateMarketCondition(prompt: string) {
  const stream = createStreamableValue("");

  const result = streamText({
    model: openai("gpt-4o-mini"),
    prompt: prompt,
  });

  let usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null = null;

  (async () => {
    for await (const delta of result.textStream) {
      stream.update(delta);
    }
    // 토큰 사용량 정보 얻기
    usage = await result.usage;
    stream.done();
  })();

  // usage는 비동기적으로 할당되므로, stream.value와 함께 Promise로 반환
  return {
    output: stream.value,
    usage: result.usage, // Promise 객체를 직접 반환
  };
}
