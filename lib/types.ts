// lib/types.ts
export interface Resource {
  id: string;
  title: string;
  link?: string | null;
  date?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Embedding {
  id: string;
  resourceId: string;
  content: string;
  embedding: number[];
}
