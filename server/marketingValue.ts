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

/**
 * Explicit tiers for the website's directory categories (all 76 as of
 * 2026-07-02) — the strongest signal when populated. Unlisted/new categories
 * fall through to the keyword classifier.
 */
const CATEGORY_TIER: Record<string, ValueTier> = {
  // 3 — heavy marketing buyers (high LTV, competitive local ad markets)
  "Accounting Firms": 3, "Auto Repair Shops": 3, "Banks & Credit Unions": 3,
  "Car Dealerships": 3, "Chiropractic Offices": 3, "Cleaning Services": 3,
  "Dental Practices": 3, "Doctors & Medical Offices": 3, "Electricians": 3,
  "Eye Care & Optometry": 3, "Furniture Stores": 3, "HVAC Services": 3,
  "Home Services": 3, "IT Services": 3, "Insurance Agencies": 3,
  "Landscaping Companies": 3, "Law Firms": 3, "Med Spas": 3,
  "Mental Health & Therapy": 3, "Moving & Storage": 3, "Plumbers": 3,
  "Pool Services": 3, "Property Management": 3, "Real Estate Agents": 3,
  "Restoration Companies": 3, "Roofers": 3, "Senior Living & Care": 3,
  "Solar Installers": 3, "Veterinary Clinics": 3, "Wedding Venues": 3,
  "Wineries": 3,
  // 2 — moderate buyers
  "Bakeries & Dessert Shops": 2, "Bars": 2, "Breweries": 2,
  "Bridal Shops & Tuxedo Rentals": 2, "Bowling & Entertainment": 2,
  "Car Wash & Detailing": 2, "Catering Services": 2, "Child Care & Daycares": 2,
  "Clothing Boutiques": 2, "Coffee & Cafes": 2, "Escape Rooms": 2,
  "Event Planners": 2, "Fitness Studios": 2, "Florists": 2, "Food Trucks": 2,
  "Gyms": 2, "Hair Salons": 2, "Massage & Bodywork": 2, "Nail Salons": 2,
  "Pet Services": 2, "Photography Studios": 2, "Places to Stay": 2,
  "Restaurants": 2, "Staffing & Recruiting": 2, "Tours & Experiences": 2,
  "Transportation & Limo": 2, "Wedding DJs & Entertainment": 2,
  "Wedding Officiants": 2, "Wedding Photographers": 2, "Wedding Videographers": 2,
  // 1 — default retail/recreation
  "Big Box & Department Stores": 1, "Bike Shops": 1, "Farmers Markets": 1,
  "Outdoor Recreation": 1, "Pickleball Courts": 1, "Shopping Centers & Plazas": 1,
  "Shops": 1, "Specialty Grocery": 1, "Theater & Performing Arts": 1,
  "Things to Do": 1, "Thrift & Resale Stores": 1, "Yogurt Shops": 1,
  // 0 — rarely buy marketing
  "Churches": 0, "Non-Profits & Charities": 0, "Schools & Education": 0,
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
export function marketingValueTier(
  name: string | null,
  verticalType: string | null,
  categoryName?: string | null
): ValueTier {
  const fromCategory = categoryName ? CATEGORY_TIER[categoryName] ?? null : null;
  const fromKeyword = name ? keywordTier(name) : null;
  // Non-buyers are definitive from either signal.
  if (fromCategory === 0 || fromKeyword === 0) return 0;
  const fromVertical = verticalType ? VERTICAL_TIER[verticalType] ?? null : null;
  return Math.max(fromCategory ?? 1, fromKeyword ?? 1, fromVertical ?? 1) as ValueTier;
}
