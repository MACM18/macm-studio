import { TECH_STACKS, ADDONS, MAINTENANCE_CARE, MAINTENANCE_PRIORITY, INBOX_PRICE } from "@/lib/pricing";
import { SAMPLE_PROJECTS } from "@/lib/samples";
import { FAQ_ITEMS } from "@/lib/seo";

export interface DynamicKnowledgeChunk {
  slug: string;
  title: string;
  category: "pricing" | "stack" | "addon" | "process" | "faq" | "sample" | "general";
  content: string;
  metadata: Record<string, unknown>;
}

export function getLiveStudioKnowledgeChunks(): DynamicKnowledgeChunk[] {
  return [
    // 1. Dynamic Tech Stacks with current pricing & delivery
    ...TECH_STACKS.map((stack) => ({
      slug: `stack-${stack.id}`,
      title: `Tech Stack: ${stack.name}`,
      category: "stack" as const,
      content: `${stack.name} (${stack.shortName}). ${stack.description} Delivery timeframe: ${stack.delivery}. Current Pricing: LKR ${stack.price.LKR.toLocaleString()} / USD $${stack.price.USD}. Inclusions: bespoke responsive design, speed optimization, search-friendly foundation, and complete production handover with full source ownership.`,
      metadata: {
        stackId: stack.id,
        priceLKR: stack.price.LKR,
        priceUSD: stack.price.USD,
        delivery: stack.delivery,
      },
    })),

    // 2. Dynamic Add-ons with current pricing
    ...ADDONS.map((addon) => ({
      slug: `addon-${addon.id}`,
      title: `Addon: ${addon.name}`,
      category: "addon" as const,
      content: `${addon.name}: ${addon.detail}. Current Pricing: LKR ${addon.price.LKR.toLocaleString()} / USD $${addon.price.USD}. Seamlessly integrates with your website foundation.`,
      metadata: {
        addonId: addon.id,
        priceLKR: addon.price.LKR,
        priceUSD: addon.price.USD,
      },
    })),

    // 3. Dynamic Sample Projects (Portfolio)
    ...SAMPLE_PROJECTS.map((sample) => ({
      slug: `sample-${sample.id}`,
      title: `Portfolio Sample: ${sample.name} (${sample.category})`,
      category: "sample" as const,
      content: `${sample.name} [Sample #${sample.number}]: ${sample.category} concept for ${sample.domain}. ${sample.description} Highlights: ${sample.highlights.join(", ")}. Direction: ${sample.previewLabel}. Status: ${sample.status}.`,
      metadata: {
        sampleId: sample.id,
        number: sample.number,
        category: sample.category,
        domain: sample.domain,
        theme: sample.theme,
      },
    })),

    // 4. Website Care & Maintenance
    {
      slug: "care-plan",
      title: "Ongoing Care & Maintenance: Website Care",
      category: "pricing",
      content: `Website Care is an optional ongoing support plan after handover. Monthly: LKR ${MAINTENANCE_CARE.monthlyPrice.LKR.toLocaleString()} / USD $${MAINTENANCE_CARE.monthlyPrice.USD}. Yearly: LKR ${MAINTENANCE_CARE.yearlyPrice.LKR.toLocaleString()} / USD $${MAINTENANCE_CARE.yearlyPrice.USD} (includes 2 months free + ${MAINTENANCE_CARE.domainRenewal}). Inclusions: ${MAINTENANCE_CARE.inclusions.join(", ")}. Priority response tier available: 24-hour acknowledgement and routine fixes targeted within 1-2 business days.`,
      metadata: {
        monthlyLKR: MAINTENANCE_CARE.monthlyPrice.LKR,
        yearlyLKR: MAINTENANCE_CARE.yearlyPrice.LKR,
        priorityMonthlyLKR: MAINTENANCE_PRIORITY.monthlyPrice.LKR,
      },
    },

    // 5. Business Email Inboxes
    {
      slug: "business-email-inboxes",
      title: "Business Email Setup & Extra Inboxes",
      category: "pricing",
      content: `Every MACM build includes 1 professional business email inbox setup with SPF, DKIM, and DMARC DNS configuration. Extra inboxes can be added at LKR ${INBOX_PRICE.LKR} / USD $${INBOX_PRICE.USD} each per month.`,
      metadata: {
        inboxPriceLKR: INBOX_PRICE.LKR,
        inboxPriceUSD: INBOX_PRICE.USD,
      },
    },

    // 6. Milestone Structure
    {
      slug: "payment-milestones",
      title: "Project Payment Milestone Structure",
      category: "pricing",
      content: `MACM projects operate on a transparent 3-stage milestone payment model: 10% Kickoff (locks project scope and initial planning), 50% Working Demo (paid when main interactive website is delivered and functioning for review), 40% Final Handover (paid upon final checks, launch, and DNS/code handover).`,
      metadata: {
        kickoffPercent: 10,
        demoPercent: 50,
        handoverPercent: 40,
      },
    },

    // 7. FAQs
    ...FAQ_ITEMS.map((faq, index) => ({
      slug: `faq-${index + 1}`,
      title: `FAQ: ${faq.question}`,
      category: "faq" as const,
      content: `Question: ${faq.question}\nAnswer: ${faq.answer}`,
      metadata: { index: index + 1 },
    })),

    // 8. Process
    {
      slug: "process-overview",
      title: "Web Development Process (4 Stages)",
      category: "process",
      content: `1. Planning and direction: Agree on goals, audience, site structure, and scope. 2. Design and structure: Visual direction, layout, and copy placement. 3. Working website: An interactive prototype deployed early for review and refinement. 4. Production handover: DNS routing, SSL certificates, business email verification, clean code repository, and documentation handover with zero vendor lock-in.`,
      metadata: {},
    },

    // 9. Ownership
    {
      slug: "studio-ownership-guarantee",
      title: "Ownership and Zero Lock-in Policy",
      category: "general",
      content: `At MACM Studio, you own everything upon final payment: source code, deployment assets, configuration files, and database schemas. We never lock clients into proprietary builders or restrictive hosting contracts. Handover includes direct server access or deployment pipelines.`,
      metadata: {},
    },

    // 10. Consultations
    {
      slug: "booking-calls",
      title: "Discovery Call & Meeting Consultations",
      category: "process",
      content: `Prospective and active clients can book a 30-minute Google Meet discovery call directly from the site. Availability windows (Asia/Colombo): Weekdays 8:00 PM–9:30 PM, Saturday 5:00 PM–9:00 PM, Sunday 8:00 AM–6:00 PM. Includes automated Google Calendar invite and private Meet link.`,
      metadata: {},
    },
  ];
}
