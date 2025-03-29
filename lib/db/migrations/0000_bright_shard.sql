CREATE TABLE IF NOT EXISTS "ai"."daily_market_condition" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"date" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai"."embeddings" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"date" text,
	"origin_id" varchar(191) NOT NULL,
	"origin_type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"title_embedding" vector(1536) NOT NULL,
	"embedding" vector(1536) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai"."news" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"link" text,
	"date" text,
	"content" text NOT NULL,
	"company" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai"."weekly_report" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"content" text NOT NULL,
	"market_analysis_ids" text[] NOT NULL,
	"news_ids" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embeddingIndex" ON "ai"."embeddings" USING hnsw ("embedding" vector_cosine_ops);