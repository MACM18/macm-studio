import { PrismaClient, type Prisma } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateEmbedding } from "../lib/copilot/embeddings.ts";
import { getLiveStudioKnowledgeChunks } from "../lib/copilot/knowledge-base.ts";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/macm";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting to database...");
  await prisma.$connect();

  const knowledgeItems = getLiveStudioKnowledgeChunks();
  console.log(`Ingesting ${knowledgeItems.length} studio knowledge chunks (including all current stacks, pricing, and sample projects)...`);

  for (const item of knowledgeItems) {
    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbedding(`${item.title}\n\n${item.content}`);
    } catch {
      // Embedding generation optional
    }

    if (embedding && embedding.length > 0) {
      const vectorStr = `[${embedding.join(",")}]`;
      await prisma.$executeRawUnsafe(`
        INSERT INTO "StudioKnowledgeChunk" ("id", "slug", "title", "category", "content", "metadata", "embedding", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '${item.slug}', '${item.title.replace(/'/g, "''")}', '${item.category}', '${item.content.replace(/'/g, "''")}', '${JSON.stringify(item.metadata || {}).replace(/'/g, "''")}'::jsonb, '${vectorStr}'::vector, NOW(), NOW())
        ON CONFLICT ("slug") DO UPDATE SET
          "title" = EXCLUDED."title",
          "category" = EXCLUDED."category",
          "content" = EXCLUDED."content",
          "metadata" = EXCLUDED."metadata",
          "embedding" = EXCLUDED."embedding",
          "updatedAt" = NOW();
      `);
      console.log(`✓ Indexed ${item.slug} (with pgvector embedding)`);
    } else {
      await prisma.studioKnowledgeChunk.upsert({
        where: { slug: item.slug },
        create: {
          slug: item.slug,
          title: item.title,
          category: item.category,
          content: item.content,
          metadata: item.metadata as Prisma.InputJsonValue | undefined,
        },
        update: {
          title: item.title,
          category: item.category,
          content: item.content,
          metadata: item.metadata as Prisma.InputJsonValue | undefined,
        },
      });
      console.log(`✓ Indexed ${item.slug} (text-only)`);
    }

    // Small delay to prevent rate-limiting spikes
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log("Ingestion complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
