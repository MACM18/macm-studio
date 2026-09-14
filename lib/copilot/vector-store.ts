import "server-only";
import { prisma } from "@/lib/db";
import { generateEmbedding } from "./embeddings";

export interface KnowledgeMatch {
  id: string;
  slug: string;
  title: string;
  category: string;
  content: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
}

export async function searchKnowledge(
  query: string,
  options: { limit?: number; minSimilarity?: number; category?: string } = {}
): Promise<KnowledgeMatch[]> {
  const limit = options.limit ?? 4;
  const minSimilarity = options.minSimilarity ?? 0.35;
  const queryVector = await generateEmbedding(query);

  if (queryVector && queryVector.length > 0) {
    try {
      const vectorString = `[${queryVector.join(",")}]`;
      const rows = await prisma.$queryRaw<
        Array<{
          id: string;
          slug: string;
          title: string;
          category: string;
          content: string;
          metadata: unknown;
          similarity: number;
        }>
      >`
        SELECT 
          id, 
          slug, 
          title, 
          category, 
          content, 
          metadata,
          1 - (embedding <=> ${vectorString}::vector) AS similarity
        FROM "StudioKnowledgeChunk"
        WHERE embedding IS NOT NULL
        ${options.category ? prisma.$queryRaw`AND category = ${options.category}` : prisma.$queryRaw``}
        ORDER BY embedding <=> ${vectorString}::vector ASC
        LIMIT ${limit};
      `;

      const matches = rows
        .filter((r) => r.similarity >= minSimilarity)
        .map((r) => ({
          ...r,
          metadata: (r.metadata as Record<string, unknown>) || null,
        }));

      if (matches.length > 0) {
        return matches;
      }
    } catch {
      // Fallback to text matching if pgvector query fails or table is empty
    }
  }

  // Text-based fallback search
  const keywords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (keywords.length === 0) {
    return [];
  }

  const fallbackChunks = await prisma.studioKnowledgeChunk.findMany({
    where: {
      AND: [
        options.category ? { category: options.category } : {},
        {
          OR: keywords.flatMap((kw) => [
            { title: { contains: kw, mode: "insensitive" as const } },
            { content: { contains: kw, mode: "insensitive" as const } },
            { category: { contains: kw, mode: "insensitive" as const } },
          ]),
        },
      ],
    },
    take: limit,
  });

  return fallbackChunks.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    category: c.category,
    content: c.content,
    metadata: (c.metadata as Record<string, unknown>) || null,
    similarity: 0.8,
  }));
}
