export type SamplePreviewState = "checking" | "available" | "unavailable";

export interface SampleProject {
  id: string;
  number: string;
  name: string;
  category: string;
  domain: string;
  description: string;
  highlights: string[];
  status: "live" | "coming-soon";
  theme: "hospitality" | "legal" | "hotel" | "creative" | "wellness" | "property" | "saas" | "commerce" | "education" | "events";
  previewLabel: string;
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: "harbor-hearth",
    number: "01",
    name: "Harbor & Hearth",
    category: "Restaurant",
    domain: "sample1.macm.lk",
    description: "A warm, editorial restaurant website built to make the menu, story, and next reservation easy to find.",
    highlights: ["Hero dish photography", "Menu preview", "Chef story", "Opening hours and location", "Reservation CTA", "Mobile-first menu navigation"],
    status: "live",
    theme: "hospitality",
    previewLabel: "Wood-fired / coastal cuisine",
  },
  {
    id: "northline-legal",
    number: "02",
    name: "Northline Legal",
    category: "Professional Services",
    domain: "sample2.macm.lk",
    description: "A calm, trustworthy website concept for a law or consulting firm that needs to explain expertise clearly.",
    highlights: ["Practice areas", "Attorney profiles", "Client process", "Frequently asked questions", "Consultation CTA", "Trust-focused typography"],
    status: "coming-soon",
    theme: "legal",
    previewLabel: "Strategic counsel / discretion",
  },
  {
    id: "ceylon-house",
    number: "03",
    name: "Ceylon House",
    category: "Boutique Hotel",
    domain: "sample3.macm.lk",
    description: "An elegant hospitality website concept that gives the stay, the setting, and the booking journey room to breathe.",
    highlights: ["Rooms and suites", "Amenities", "Gallery", "Experiences", "Location guide", "Booking enquiry CTA"],
    status: "coming-soon",
    theme: "hotel",
    previewLabel: "Tropical modernism / quiet luxury",
  },
  {
    id: "aster-form",
    number: "04",
    name: "Aster & Form",
    category: "Interior Design Studio",
    domain: "sample4.macm.lk",
    description: "A portfolio-led creative site concept designed to let the work speak first while still making enquiries feel effortless.",
    highlights: ["Large project gallery", "Case-study pages", "Services", "Studio profile", "Testimonials", "Project enquiry form"],
    status: "coming-soon",
    theme: "creative",
    previewLabel: "Architectural interiors / cobalt grid",
  },
  {
    id: "luma-health",
    number: "05",
    name: "Luma Health",
    category: "Wellness Clinic",
    domain: "sample5.macm.lk",
    description: "A friendly, reassuring clinic website concept that helps new patients understand their options and take the next step.",
    highlights: ["Treatments", "Practitioner profiles", "New-patient information", "FAQs", "Appointment CTA", "Contact and location details"],
    status: "coming-soon",
    theme: "wellness",
    previewLabel: "Care / balance / wellbeing",
  },
  {
    id: "kora-estates",
    number: "06",
    name: "Kora Estates",
    category: "Property Development",
    domain: "sample6.macm.lk",
    description: "A high-end property marketing concept built to turn a place, its details, and its potential into a confident enquiry.",
    highlights: ["Featured property", "Floor plans", "Amenities", "Location map", "Image gallery", "Enquiry form"],
    status: "coming-soon",
    theme: "property",
    previewLabel: "A better address / coming home",
  },
  {
    id: "fieldnote",
    number: "07",
    name: "Fieldnote",
    category: "SaaS Product Landing Page",
    domain: "sample7.macm.lk",
    description: "A polished product website concept for a productivity app, showing how a digital service can explain its value simply.",
    highlights: ["Product explanation", "Feature sections", "Pricing cards", "Customer quotes", "FAQ", "Free-trial CTA"],
    status: "coming-soon",
    theme: "saas",
    previewLabel: "Make space for good work",
  },
  {
    id: "mora-coffee",
    number: "08",
    name: "Mora Coffee",
    category: "E-commerce Concept",
    domain: "sample8.macm.lk",
    description: "A static storefront concept for a coffee and lifestyle brand, ready to grow into a complete shopping experience.",
    highlights: ["Product cards", "Product detail sections", "Subscription concept", "Brand story", "Delivery information", "WhatsApp order CTA"],
    status: "coming-soon",
    theme: "commerce",
    previewLabel: "Small batch / daily ritual",
  },
  {
    id: "orbit-learning",
    number: "09",
    name: "Orbit Learning",
    category: "Education Platform",
    domain: "sample9.macm.lk",
    description: "A structured course and training website concept that makes programmes, outcomes, and enrolment easy to understand.",
    highlights: ["Course categories", "Instructor profiles", "Learning outcomes", "Student testimonials", "Enrollment CTA", "FAQ section"],
    status: "coming-soon",
    theme: "education",
    previewLabel: "Learn with direction",
  },
  {
    id: "sora-events",
    number: "10",
    name: "Sora Events",
    category: "Wedding and Events Studio",
    domain: "sample10.macm.lk",
    description: "A visual, emotional event-planning concept with a softer voice and a clear path from inspiration to availability enquiry.",
    highlights: ["Event packages", "Gallery", "Planning process", "Testimonials", "Availability enquiry", "WhatsApp CTA"],
    status: "coming-soon",
    theme: "events",
    previewLabel: "Gather beautifully",
  },
];
