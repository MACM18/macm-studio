import { PrismaClient, type Prisma } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { TECH_STACKS, ADDONS, MAINTENANCE_CARE, MAINTENANCE_PRIORITY, INBOX_PRICE } from "../lib/pricing.js";
import { FAQ_ITEMS } from "../lib/seo.js";
import { generateEmbedding } from "../lib/copilot/embeddings.js";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/macm";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

interface KnowledgeItem {
  slug: string;
  title: string;
  category: "pricing" | "stack" | "addon" | "process" | "faq" | "sample" | "general";
  content: string;
  metadata?: Prisma.InputJsonValue;
}

const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  ...TECH_STACKS.map((stack) => ({
    slug: `stack-${stack.id}`,
    title: `Tech Stack: ${stack.name}`,
    category: "stack" as const,
    content: `${stack.name} (${stack.shortName}). ${stack.description} Delivery timeframe: ${stack.delivery}. Pricing: LKR ${stack.price.LKR.toLocaleString()} / USD $${stack.price.USD}. Included: custom design, clean responsive structure, search-friendly foundations, and production handover with full ownership.`,
    metadata: { stackId: stack.id, priceLKR: stack.price.LKR, priceUSD: stack.price.USD, delivery: stack.delivery },
  })),

  ...ADDONS.map((addon) => ({
    slug: `addon-${addon.id}`,
    title: `Addon: ${addon.name}`,
    category: "addon" as const,
    content: `${addon.name}: ${addon.detail}. Pricing: LKR ${addon.price.LKR.toLocaleString()} / USD $${addon.price.USD}. Integrates seamlessly with your website foundation.`,
    metadata: { addonId: addon.id, priceLKR: addon.price.LKR, priceUSD: addon.price.USD },
  })),

  {
    slug: "care-plan",
    title: "Ongoing Care & Maintenance: Website Care",
    category: "pricing",
    content: `Website Care is an optional ongoing support plan after handover. Monthly: LKR ${MAINTENANCE_CARE.monthlyPrice.LKR} / USD $${MAINTENANCE_CARE.monthlyPrice.USD}. Yearly: LKR ${MAINTENANCE_CARE.yearlyPrice.LKR} / USD $${MAINTENANCE_CARE.yearlyPrice.USD} (includes 2 months free + ${MAINTENANCE_CARE.domainRenewal}). Inclusions: ${MAINTENANCE_CARE.inclusions.join(", ")}. Priority response tier available: 24-hour acknowledgement and routine fixes targeted within 1-2 business days.`,
    metadata: {
      monthlyLKR: MAINTENANCE_CARE.monthlyPrice.LKR,
      yearlyLKR: MAINTENANCE_CARE.yearlyPrice.LKR,
      priorityMonthlyLKR: MAINTENANCE_PRIORITY.monthlyPrice.LKR,
    },
  },

  {
    slug: "business-email-inboxes",
    title: "Business Email Setup & Extra Inboxes",
    category: "pricing",
    content: `Every MACM build includes 1 professional business email inbox setup with SPF, DKIM, and DMARC DNS configuration. Extra inboxes can be added at LKR ${INBOX_PRICE.LKR} / USD $${INBOX_PRICE.USD} each per month.`,
    metadata: { inboxPriceLKR: INBOX_PRICE.LKR, inboxPriceUSD: INBOX_PRICE.USD },
  },

  {
    slug: "payment-milestones",
    title: "Project Payment Milestone Structure",
    category: "pricing",
    content: `MACM projects operate on a transparent 3-stage milestone payment model: 10% Kickoff (locks project scope and initial planning), 50% Working Demo (paid when main interactive website is delivered and functioning for review), 40% Final Handover (paid upon final checks, launch, and DNS/code handover).`,
    metadata: { kickoffPercent: 10, demoPercent: 50, handoverPercent: 40 },
  },

  ...FAQ_ITEMS.map((faq, index) => ({
    slug: `faq-${index + 1}`,
    title: `FAQ: ${faq.question}`,
    category: "faq" as const,
    content: `Question: ${faq.question}\nAnswer: ${faq.answer}`,
  })),

  {
    slug: "process-overview",
    title: "Web Development Process (4 Stages)",
    category: "process",
    content: `1. Planning and direction: Agree on goals, audience, site structure, and scope. 2. Design and structure: Visual direction, layout, and copy placement. 3. Working website: An interactive prototype deployed early for review and refinement. 4. Production handover: DNS routing, SSL certificates, business email verification, clean code repository, and documentation handover with zero vendor lock-in.`,
  },

  {
    slug: "studio-ownership-guarantee",
    title: "Ownership and Zero Lock-in Policy",
    category: "general",
    content: `At MACM Studio, you own everything upon final payment: source code, deployment assets, configuration files, and database schemas. We never lock clients into proprietary builders or restrictive hosting contracts. Handover includes direct server access or deployment pipelines.`,
  },

  {
    slug: "booking-calls",
    title: "Discovery Call & Meeting Consultations",
    category: "process",
    content: `Prospective and active clients can book a 30-minute Google Meet discovery call directly from the site. Availability windows (Asia/Colombo): Weekdays 8:00 PM–9:30 PM, Saturday 5:00 PM–9:00 PM, Sunday 8:00 AM–6:00 PM. Includes automated Google Calendar invite and private Meet link.`,
  },
];

async function main() {
  console.log("Connecting to database...");
  await prisma.$connect();

  console.log(`Ingesting ${KNOWLEDGE_ITEMS.length} studio knowledge chunks...`);

  for (const item of KNOWLEDGE_ITEMS) {
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
