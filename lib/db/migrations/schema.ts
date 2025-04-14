import { pgTable, pgSchema, index, pgEnum, varchar, text, vector, timestamp } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const ai = pgSchema("ai");
export const memberships_membershiptype_enumInAi = ai.enum("memberships_membershiptype_enum", ['0', '2'])
export const surveys_investmenttype_enumInAi = ai.enum("surveys_investmenttype_enum", ['0', '1', '2', '3', '4'])
export const surveys_usagepath_enumInAi = ai.enum("surveys_usagepath_enum", ['0', '1', '2', '3', '4'])
export const user_backgrounds_investmentperiod_enumInAi = ai.enum("user_backgrounds_investmentperiod_enum", ['0', '1', '2', '3'])
export const user_metadatas_gender_enumInAi = ai.enum("user_metadatas_gender_enum", ['0', '1', '100'])
export const aal_level = pgEnum("aal_level", ['aal1', 'aal2', 'aal3'])
export const code_challenge_method = pgEnum("code_challenge_method", ['s256', 'plain'])
export const factor_status = pgEnum("factor_status", ['unverified', 'verified'])
export const factor_type = pgEnum("factor_type", ['totp', 'webauthn', 'phone'])
export const one_time_token_type = pgEnum("one_time_token_type", ['confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token'])
export const key_status = pgEnum("key_status", ['default', 'valid', 'invalid', 'expired'])
export const key_type = pgEnum("key_type", ['aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20'])
export const memberships_membershiptype_enum = pgEnum("memberships_membershiptype_enum", ['0', '2'])
export const surveys_investmenttype_enum = pgEnum("surveys_investmenttype_enum", ['0', '1', '2', '3', '4'])
export const surveys_usagepath_enum = pgEnum("surveys_usagepath_enum", ['0', '1', '2', '3', '4'])
export const user_backgrounds_investmentperiod_enum = pgEnum("user_backgrounds_investmentperiod_enum", ['0', '1', '2', '3'])
export const user_metadatas_gender_enum = pgEnum("user_metadatas_gender_enum", ['0', '1', '100'])
export const action = pgEnum("action", ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR'])
export const equality_op = pgEnum("equality_op", ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in'])


export const embeddingsInAi = ai.table("embeddings", {
	id: varchar("id", { length: 191 }).primaryKey().notNull(),
	date: text("date"),
	origin_id: varchar("origin_id", { length: 191 }).notNull(),
	origin_type: varchar("origin_type", { length: 50 }).notNull(),
	content: text("content").notNull(),
	title_embedding: vector("title_embedding", { dimensions: 1536 }).notNull(),
	embedding: vector("embedding", { dimensions: 1536 }).notNull(),
},
(table) => {
	return {
		embeddingIndex: index("embeddingIndex").using("hnsw", table.embedding.op("vector_cosine_ops")),
	}
});

export const newsInAi = ai.table("news", {
	id: varchar("id", { length: 191 }).primaryKey().notNull(),
	title: text("title").notNull(),
	link: text("link"),
	date: text("date"),
	content: text("content").notNull(),
	company: text("company"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	keywords: text("keywords").array().notNull(),
});

export const weekly_reportInAi = ai.table("weekly_report", {
	id: varchar("id", { length: 191 }).primaryKey().notNull(),
	start_date: text("start_date").notNull(),
	end_date: text("end_date").notNull(),
	content: text("content").notNull(),
	market_analysis_ids: text("market_analysis_ids").array().notNull(),
	news_ids: text("news_ids").array().notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});