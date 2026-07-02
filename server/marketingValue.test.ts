import { describe, expect, it } from "vitest";
import { marketingValueTier } from "./marketingValue";

describe("marketingValueTier (route prioritization)", () => {
  it("heavy marketing buyers score 3 by name keyword", () => {
    expect(marketingValueTier("Smith & Jones Law Group", null)).toBe(3);
    expect(marketingValueTier("Temecula Valley Dental Care", null)).toBe(3);
    expect(marketingValueTier("Ace Plumbing & Rooter", null)).toBe(3);
    expect(marketingValueTier("Sunrise Realty", null)).toBe(3);
    expect(marketingValueTier("Wilson Creek Winery", null)).toBe(3);
  });

  it("vertical_type carries the score when the name is generic", () => {
    expect(marketingValueTier("Johnson Brothers", "home_services")).toBe(3);
    expect(marketingValueTier("Bella Vita", "medical")).toBe(3);
    expect(marketingValueTier("Corner Spot", "hospitality")).toBe(2);
    expect(marketingValueTier("Main Street Shop", "retail")).toBe(1);
  });

  it("moderate buyers score 2", () => {
    expect(marketingValueTier("Old Town Coffee Roasters", null)).toBe(2);
    expect(marketingValueTier("Luxe Nails & Spa", null)).toBe(2);
    expect(marketingValueTier("Iron Tribe Fitness", null)).toBe(2);
  });

  it("unknown types default to 1", () => {
    expect(marketingValueTier("Barn Yard Chicks", null)).toBe(1);
    expect(marketingValueTier(null, null)).toBe(1);
  });

  it("non-buyers (churches, schools, government) score 0 and override verticals", () => {
    expect(marketingValueTier("Grace Community Church", null)).toBe(0);
    expect(marketingValueTier("Temecula Elementary School", null)).toBe(0);
    expect(marketingValueTier("City of Temecula Parks", "home_services")).toBe(0);
  });

  it("keyword upgrades a weaker vertical", () => {
    // hospitality vertical (2) but it's a wedding venue (3)
    expect(marketingValueTier("Grand Tradition Estate & Gardens", "hospitality")).toBe(3);
  });
});
