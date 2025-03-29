import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env.mjs";
import { pgSchema } from "drizzle-orm/pg-core";

export const aiSchema = pgSchema("ai");

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema: { ai: aiSchema } });
