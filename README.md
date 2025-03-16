# Financial Intelligence RAG Chatbot

A modern financial intelligence platform built with Retrieval-Augmented Generation (RAG) to provide data-driven insights on market conditions, news, and weekly reports.

## Overview

This project implements a chatbot that provides responses based only on data within its knowledge base. The system stores and retrieves:

- Daily market conditions
- Financial news articles
- Weekly summary reports

Using RAG technology, the chatbot can answer questions by retrieving and synthesizing information from these sources, ensuring accurate and up-to-date responses.

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org) 14 (App Router), [shadcn-ui](https://ui.shadcn.com) with [TailwindCSS](https://tailwindcss.com)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/docs), [OpenAI](https://openai.com) embeddings and LLMs
- **Backend**: [Next.js](https://nextjs.org) API routes
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector) for vector search
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)

## Features

- Create and store daily market condition reports
- Add and categorize financial news articles
- Generate weekly summary reports with references to market conditions and news
- Semantic search across all content using vector embeddings
- Admin dashboard for content management
- User-facing chatbot interface for natural language queries

## Project Structure

```
/app                # Next.js App Router
  /admin            # Admin dashboard for content management
  /api              # API routes for data operations
  /page.tsx         # Main chat interface
/lib
  /actions          # Server actions for data operations
  /ai               # AI integration and embedding functionality
  /db               # Database setup and schema definitions
/components         # UI components
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL with pgvector extension

### Setup

1. Clone the repository
   ```
   git clone <repository-url>
   cd ai-sdk-rag-starter
   ```

2. Install dependencies
   ```
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables
   ```
   cp .env.example .env.local
   ```
   Fill in your database credentials and OpenAI API key.

4. Run database migrations
   ```
   npm run db:migrate
   # or
   pnpm db:migrate
   ```

5. Start the development server
   ```
   npm run dev
   # or
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Commands

- Generate migrations: `npm run db:generate`
- Apply migrations: `npm run db:migrate`
- View database with Drizzle Studio: `npm run db:studio`

## License

[MIT](LICENSE)