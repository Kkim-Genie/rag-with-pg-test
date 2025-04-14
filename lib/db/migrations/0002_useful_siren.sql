CREATE TABLE IF NOT EXISTS "ai"."fingoo_embeddings" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fingooEmbeddingIndex" ON "ai"."fingoo_embeddings" USING hnsw ("embedding" vector_cosine_ops);