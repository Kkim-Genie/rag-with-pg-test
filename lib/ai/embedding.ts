import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { db } from "../db";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { embeddings } from "../db/schema/embeddings";
import { chunk } from "llm-chunk";

const embeddingModel = openai.embedding("text-embedding-ada-002");

const generateChunks = (input: string, overlap: number): string[] => {
  return chunk(input, { overlap }); // 청크 알고리즘 추후 이것저것 테스트할 필요 있어 보임
  //   return input
  //     .trim()
  //     .split(".")
  //     .filter((i) => i !== "");
};

export const generateEmbeddings = async (
  value: string,
  useChunk: boolean = true,
  overlap: number = 0
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = useChunk ? generateChunks(value, overlap) : [value];
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded
  )})`;
  const similarGuides = await db
    .select({ name: embeddings.content, similarity })
    .from(embeddings)
    .where(gt(similarity, 0.5))
    .orderBy((t) => desc(t.similarity))
    .limit(4);
  return similarGuides;
};
