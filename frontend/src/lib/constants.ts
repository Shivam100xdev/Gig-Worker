import type { PlatformCategory } from "@/types";

/** GST registration is generally required past ₹20L turnover for services
 * (₹40L for goods in most states). We use the conservative services
 * threshold since most gig work is a service. This is a nudge, not tax
 * advice — surfaced via gstAdvisoryAtom. */
export const GST_REGISTRATION_THRESHOLD = 2_000_000; // ₹20,00,000

export const PLATFORM_CATEGORY_LABELS: Record<PlatformCategory, string> = {
  "ride-hailing": "Ride-hailing",
  "food-delivery": "Food delivery",
  freelance: "Freelance / contract",
  "ecommerce-seller": "E-commerce seller",
  logistics: "Logistics & delivery",
  other: "Other",
};

export const PAYMENT_STATUS_LABELS = {
  paid: "Paid",
  not_paid: "Not paid",
  partially_paid: "Partially paid",
} as const;

export const CURRENT_ASSESSMENT_YEAR = "2026-27";
