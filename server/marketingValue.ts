/**
 * Marketing-value tiers for route prioritization: which businesses typically
 * PAY for digital marketing (the bounty comes from converting them into
 * paying directory customers eventually, so ambassadors should knock on the
 * highest-propensity doors first).
 *
 * Grounded in industry ad-spend benchmarks (WordStream 2025 Google Ads
 * benchmarks; industry CPC/CPL reports): legal, medical, home services,
 * real-estate/finance and auto carry the highest customer lifetime values and
 * the most competitive local ad markets; hospitality/food/personal-care spend
 * moderately; churches/schools/government essentially never buy.
 *
 * Tier scale: 3 = heavy marketing buyers · 2 = moderate · 1 = default ·
 * 0 = rarely buys. Sources: website `vertical_type` where populated (~22% of
 * rows) plus a name-keyword classifier for the rest.
 */
export type ValueTier = 0 | 1 | 2 | 3;

const VERTICAL_TIER: Record<string, ValueTier> = {
  home_services: 3,
  medical: 3,
  hospitality: 2,
  retail: 1,
};

// Checked in order: tier-0 phrases first (most specific), then high to low.
const TIER0_KEYWORDS = [
  "church", "ministry", "ministries", "temple", "mosque", "synagogue",
  "nonprofit", "non-profit", "foundation", "charity",
  "school district", "elementary school", "middle school", "high school",
  "city of", "county of", "library", "post office",
];

const TIER3_KEYWORDS = [
  // legal
  "law", "attorney", "legal",
  // medical / dental / vet
  "dental", "dentist", "orthodont", "chiropract", "dermatolog", "med spa", "medspa",
  "medical", "clinic", "urgent care", "physician", "pediatric", "optometr",
  "veterinar", "animal hospital", "physical therapy",
  // home services
  "plumb", "hvac", "heating", "air condition", "roof", "electric", "solar",
  "pest", "remodel", "construction", "contractor", "landscap", "garage door",
  "pool service", "pool & spa", "painting", "flooring", "handyman",
  "restoration", "tree service", "fencing", "concrete", "grading",
  // real estate / finance / insurance
  "realty", "real estate", "property management", "escrow", "mortgage",
  "insurance", "financial", "wealth", "cpa", "accounting", "tax service",
  // auto
  "auto repair", "auto body", "collision", "dealership", "tire", "transmission",
  "auto detail", "smog",
  // Temecula high-ticket hospitality
  "winery", "vineyard", "wedding", "venue", "estate",
];

const TIER2_KEYWORDS = [
  "restaurant", "grill", "cafe", "café", "coffee", "bakery", "brewery",
  "pizzeria", "taqueria", "sushi", "steakhouse", "bistro", "eatery", "catering",
  "salon", "spa", "barber", "nails", "lashes", "tattoo",
  "fitness", "gym", "yoga", "pilates", "crossfit", "martial arts", "dance studio",
  "photograph", "moving", "storage", "senior", "assisted living",
  "childcare", "preschool", "day care", "daycare",
  "hotel", "inn", "resort", "golf",
];

function keywordTier(name: string): ValueTier | null {
  const n = name.toLowerCase();
  if (TIER0_KEYWORDS.some((k) => n.includes(k))) return 0;
  if (TIER3_KEYWORDS.some((k) => n.includes(k))) return 3;
  if (TIER2_KEYWORDS.some((k) => n.includes(k))) return 2;
  return null;
}

/** Score a business by how likely its type is to pay for marketing. */
export function marketingValueTier(name: string | null, verticalType: string | null): ValueTier {
  const fromKeyword = name ? keywordTier(name) : null;
  if (fromKeyword === 0) return 0;
  const fromVertical = verticalType ? VERTICAL_TIER[verticalType] ?? null : null;
  return Math.max(fromKeyword ?? 1, fromVertical ?? 1) as ValueTier;
}
