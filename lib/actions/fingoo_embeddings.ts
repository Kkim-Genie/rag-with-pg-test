import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { generateEmbeddings } from "../ai/embedding";
import { db } from "../db";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";
import {
  fingooEmbeddings,
  insertFingooEmbeddingsSchema,
  NewFingooEmbeddingsParams,
} from "../db/schema/fingoo_embeddings";

export const CreateFingooEmbeddings = async (
  input: NewFingooEmbeddingsParams
) => {
  try {
    const { content } = insertFingooEmbeddingsSchema.parse(input);

    const embeddings = await generateEmbeddings(content, true, 100);

    await db
      .insert(fingooEmbeddings)
      .values(
        embeddings.map((embedding) => ({
          content: embedding.content,
          embedding: embedding.embedding,
        }))
      )
      .returning();

    return "News successfully created and embedded.";
  } catch (error) {
    console.log(error);
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};
