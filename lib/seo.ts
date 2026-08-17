export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How much does a website cost?",
    answer: "MACM estimates each project from its scope. Current planning options start with a focused static website, with managed WordPress, content-managed websites, and web apps priced according to the work involved. The calculator shows a clear starting estimate before a discovery call.",
  },
  {
    question: "How long does a website take?",
    answer: "A focused static website can take around one to two weeks. Managed WordPress projects are usually around two weeks, while larger content platforms and web apps take longer after the scope is agreed.",
  },
  {
    question: "Can you build a website for a Sri Lankan business?",
    answer: "Yes. MACM works with businesses in Sri Lanka and can shape the content, enquiry flow, domain setup, and website experience around local customers and the way your business operates.",
  },
  {
    question: "Can you work with clients remotely?",
    answer: "Yes. Projects can be planned and reviewed remotely with clear written scope, staged previews, and practical handover notes for clients in Sri Lanka or overseas.",
  },
  {
    question: "What is included in a custom website?",
    answer: "A custom website includes the agreed page structure, responsive design, website development, content placement, essential search-friendly foundations, testing, and a production handover. New features or pages are scoped separately.",
  },
  {
    question: "Can I update a WordPress website myself?",
    answer: "Yes. Managed WordPress is intended for teams that want to update everyday content themselves, with ongoing care available when you need help or want the site kept up to date.",
  },
  {
    question: "Do you provide domain and email setup?",
    answer: "Domain, DNS, SSL, and business email setup can be included in the agreed scope. The calculator includes one business inbox, with additional inboxes available as an option.",
  },
  {
    question: "What happens after the website launches?",
    answer: "You receive the agreed website, access details, and handover notes. Optional Website Care can begin after development is complete and the website has been handed over.",
  },
  {
    question: "Is website maintenance required?",
    answer: "Not every website needs a recurring plan. Website Care is optional and is designed for routine updates, backup checks, small content changes, domain coordination, and normal support after launch.",
  },
  {
    question: "Can you build a web app or customer portal?",
    answer: "Yes. MACM can plan customer accounts, admin areas, payments, integrations, and business workflows as a custom web application with the right scope and review stages.",
  },
  {
    question: "Who owns the website and source files?",
    answer: "The handover is planned around ownership: you receive the agreed website, assets, access details, and operating notes so your business can continue to use and manage what was built.",
  },
  {
    question: "Can I request changes after launch?",
    answer: "Yes. Small content changes can be handled through Website Care when selected. New pages, redesigns, integrations, and larger improvements are quoted as separate work.",
  },
];

export const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": "https://macm.lk/#business",
      name: "MACM",
      url: "https://macm.lk",
      email: "hello@macm.lk",
      description: "Web design, web development, and custom web applications for Sri Lankan businesses and remote teams.",
      areaServed: {
        "@type": "Country",
        name: "Sri Lanka",
      },
      knowsAbout: ["Website design", "Web development", "WordPress websites", "Web applications", "SaaS development"],
    },
    {
      "@type": "WebSite",
      "@id": "https://macm.lk/#website",
      name: "MACM",
      url: "https://macm.lk",
      description: "Web design and web development in Sri Lanka, built with care.",
      publisher: { "@id": "https://macm.lk/#business" },
    },
    ...[
      ["Custom website design", "Responsive, conversion-focused websites shaped around a business and its customers."],
      ["Managed WordPress websites", "Easy-to-update WordPress websites with optional ongoing care."],
      ["Content-managed websites", "Flexible publishing websites for teams that need to grow their content over time."],
      ["Web apps and SaaS development", "Purpose-built online tools with accounts, admin areas, integrations, and workflows."],
    ].map(([name, description]) => ({
      "@type": "Service",
      name,
      description,
      provider: { "@id": "https://macm.lk/#business" },
      areaServed: { "@type": "Country", name: "Sri Lanka" },
    })),
    {
      "@type": "FAQPage",
      "@id": "https://macm.lk/#faq",
      mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
} as const;
