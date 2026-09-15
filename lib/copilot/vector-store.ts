import "server-only";
import { prisma } from "@/lib/db";
import { generateEmbedding } from "./embeddings";
import { getLiveStudioKnowledgeChunks, type DynamicKnowledgeChunk } from "./knowledge-base";

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
  const results: KnowledgeMatch[] = [];

  // 1. Vector similarity search across PostgreSQL pgvector table
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

      for (const r of rows) {
        if (r.similarity >= minSimilarity) {
          results.push({
            ...r,
            metadata: (r.metadata as Record<string, unknown>) || null,
          });
        }
      }
    } catch {
      // Ignore query errors, proceed to dynamic & text search
    }
  }

  // 2. Dynamic in-memory matching against live pricing & sample projects
  // This guarantees that any changes to TECH_STACKS, ADDONS, or SAMPLE_PROJECTS in code
  // are immediately searchable with zero lag even before database re-indexing!
  const liveChunks = getLiveStudioKnowledgeChunks();
  const queryWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryWords.length > 0) {
    const liveMatches: KnowledgeMatch[] = [];
    for (const chunk of liveChunks) {
      if (options.category && chunk.category !== options.category) continue;
      const text = `${chunk.title} ${chunk.content} ${chunk.slug}`.toLowerCase();
      let score = 0;
      for (const w of queryWords) {
        if (text.includes(w)) {
          score += 1;
        }
      }
      if (score > 0) {
        liveMatches.push({
          id: `live-${chunk.slug}`,
          slug: chunk.slug,
          title: chunk.title,
          category: chunk.category,
          content: chunk.content,
          metadata: chunk.metadata,
          similarity: Math.min(0.99, 0.5 + score * 0.15),
        });
      }
    }

    // Merge live matches with database results, deduplicating by slug
    const seenSlugs = new Set(results.map((r) => r.slug));
    for (const lm of liveMatches) {
      if (!seenSlugs.has(lm.slug)) {
        results.push(lm);
        seenSlugs.add(lm.slug);
      }
    }
  }

  if (results.length > 0) {
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  // 3. Text-based fallback search from database
  if (queryWords.length === 0) {
    return [];
  }

  try {
    const fallbackChunks = await prisma.studioKnowledgeChunk.findMany({
      where: {
        AND: [
          options.category ? { category: options.category } : {},
          {
            OR: queryWords.flatMap((kw) => [
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
  } catch {
    return [];
  }
}
