-- Ensure pgvector extension exists in PostgreSQL
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "StudioKnowledgeChunk" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "embedding" vector(1024),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioKnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudioKnowledgeChunk_slug_key" ON "StudioKnowledgeChunk"("slug");

-- CreateIndex
CREATE INDEX "StudioKnowledgeChunk_category_idx" ON "StudioKnowledgeChunk"("category");

-- Create vector index for cosine distance similarity
CREATE INDEX IF NOT EXISTS "StudioKnowledgeChunk_embedding_hnsw_idx"
ON "StudioKnowledgeChunk"
USING hnsw ("embedding" vector_cosine_ops);
