"use server";

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";

export async function generateMarketCondition(prompt: string) {
  const stream = createStreamableValue("");

  (async () => {
    const { textStream } = streamText({
      model: openai("gpt-4o-mini"),
      prompt: prompt,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}
