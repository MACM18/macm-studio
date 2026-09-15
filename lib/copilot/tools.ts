export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export const COPILOT_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_studio_knowledge",
      description: "Search MACM Studio's knowledge base for services, technical stacks, pricing formulas, FAQs, process milestones, deliverables, maintenance care plans, and sample websites.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query, e.g., 'WordPress maintenance inclusions', 'Full-stack delivery timeframe', 'Payment gateway options'.",
          },
          category: {
            type: "string",
            description: "Optional category filter: 'pricing', 'stack', 'addon', 'process', 'faq', 'sample', or 'general'.",
            enum: ["pricing", "stack", "addon", "process", "faq", "sample", "general"],
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "configure_estimator",
      description: "Interactively update the website project calculator on the MACM Studio site with a specific tech foundation, add-ons, business inboxes, care plans, and currency.",
      parameters: {
        type: "object",
        properties: {
          currency: {
            type: "string",
            enum: ["LKR", "USD"],
            description: "Currency to use in the estimator.",
          },
          stackId: {
            type: "string",
            enum: ["static", "wordpress", "headless", "fullstack"],
            description: "Primary website foundation stack.",
          },
          addonIds: {
            type: "array",
            items: {
              type: "string",
              enum: ["payments", "auth", "api", "dedicated-backup"],
            },
            description: "Selected add-ons for the project.",
          },
          fastTrack: {
            type: "boolean",
            description: "Whether fast-track turnaround is enabled.",
          },
          extraInboxes: {
            type: "integer",
            minimum: 0,
            maximum: 20,
            description: "Number of additional business email inboxes beyond the 1 included.",
          },
          maintenancePlan: {
            type: "string",
            enum: ["none", "care"],
            description: "Optional ongoing maintenance tier ('none' or 'care').",
          },
          maintenanceBilling: {
            type: "string",
            enum: ["monthly", "yearly"],
            description: "Billing cadence for maintenance care ('monthly' or 'yearly').",
          },
          maintenancePriority: {
            type: "boolean",
            description: "Enable priority 24-hour response on maintenance.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_sample_preview",
      description: "Launch the interactive sample preview modal on the website for a specific industry direction.",
      parameters: {
        type: "object",
        properties: {
          sampleId: {
            type: "string",
            enum: [
              "harbor-hearth",
              "northline-legal",
              "ceylon-house",
              "aster-form",
              "luma-health",
              "kora-estates",
              "fieldnote",
              "mora-coffee",
              "orbit-learning",
            ],
            description: "ID of the sample project: 'mora-coffee' (e-commerce/grocery/store), 'harbor-hearth' (restaurant), 'ceylon-house' (hotel/hospitality), 'northline-legal' (law/consulting), 'luma-health' (clinic/healthcare), 'aster-form' (interior/design), 'kora-estates' (real estate), 'fieldnote' (saas/software), or 'orbit-learning' (education).",
          },
        },
        required: ["sampleId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scroll_to_section",
      description: "Scroll the visitor's browser smoothly to a specific section of the MACM Studio site.",
      parameters: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: ["#services", "#work", "#pricing-calculator", "#process", "#faq", "#contact"],
            description: "Target section anchor.",
          },
        },
        required: ["section"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prefill_enquiry_form",
      description: "Pre-fill the project enquiry brief in the contact form at the bottom of the page with details discussed in chat.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Visitor's full name" },
          email: { type: "string", description: "Visitor's work email address" },
          phone: { type: "string", description: "Visitor's WhatsApp or phone number" },
          projectType: { type: "string", description: "Type of project (e.g. 'Custom Full-Stack App', 'Boutique Hotel Website')" },
          notes: { type: "string", description: "Summary of requirements, scope, target launch date, and problem to solve." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_booking_schedule",
      description: "Get Google Calendar discovery meeting appointment hours and consultation guidelines for booking a 30-minute planning call with MACM Studio engineers.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];
