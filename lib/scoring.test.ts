import { describe, it, expect } from "vitest";
import {
  PILLARS,
  SECTORS,
  type Assessment,
  type ScoreValue,
  makeBlankAssessment,
  getWeightedPillarScore,
  getWeightedOverallScore,
  getRiskScore,
  getBusinessImpact,
  getOperationalImpactScore,
  getEfficiencyOpportunityScore,
  getRiskExposureScore,
  getTopOpportunities,
  getTopRisks,
  getROIOpportunity,
  getBand,
  generateRoadmap,
  generateExecutiveSummary,
} from "./scoring";

// Golden-master tests: these freeze the current behaviour of the scoring
// engine so refactors (god-file split, PDF migration) can't silently
// change customers' scores. If a change here is INTENTIONAL, update the
// expected values deliberately and note why in the commit message.

function fixture(value: ScoreValue, sector: Assessment["sector"] = "other"): Assessment {
  const a = makeBlankAssessment("Fixture");
  a.sector = sector;
  PILLARS.forEach((p) => p.factors.forEach((f) => (a.scores[f.id] = value)));
  return a;
}

function mixedFixture(): Assessment {
  // Deterministic spread: factor index mod 5 → 1..5
  const a = makeBlankAssessment("Mixed");
  a.sector = "retail";
  let i = 0;
  PILLARS.forEach((p) =>
    p.factors.forEach((f) => {
      a.scores[f.id] = ((i++ % 5) + 1) as ScoreValue;
    }),
  );
  return a;
}

describe("data model invariants", () => {
  it("has 8 pillars × 4 factors = 32 questions", () => {
    expect(PILLARS).toHaveLength(8);
    expect(PILLARS.flatMap((p) => p.factors)).toHaveLength(32);
  });

  it("factor ids are unique", () => {
    const ids = PILLARS.flatMap((p) => p.factors.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every pillar has a recommendation for every sector", () => {
    for (const p of PILLARS) {
      for (const s of SECTORS) {
        expect(p.strategicRecommendations[s.value]).toBeTruthy();
      }
    }
  });
});

describe("weighted scoring — golden values", () => {
  it("all-1s scores 0 overall", () => {
    expect(getWeightedOverallScore(fixture(1))).toBe(0);
  });

  it("all-5s scores 100 overall", () => {
    expect(getWeightedOverallScore(fixture(5))).toBe(100);
  });

  it("all-2s (blank default) scores 25 overall", () => {
    expect(getWeightedOverallScore(makeBlankAssessment())).toBe(25);
  });

  it("all-3s scores 50, all-4s scores 75", () => {
    expect(getWeightedOverallScore(fixture(3))).toBe(50);
    expect(getWeightedOverallScore(fixture(4))).toBe(75);
  });

  it("pillar scores equal overall when uniform", () => {
    const a = fixture(4);
    for (const p of PILLARS) {
      expect(getWeightedPillarScore(p, a.scores)).toBe(75);
    }
  });

  it("missing score keys default to 2", () => {
    const a = makeBlankAssessment();
    a.scores = {}; // wipe everything
    expect(getWeightedOverallScore(a)).toBe(25);
  });
});

describe("risk model — golden values", () => {
  it("all-5s is low risk with no factors", () => {
    const r = getRiskScore(fixture(5));
    expect(r).toEqual({ level: "low", score: 0, factors: [] });
  });

  it("all-1s is high risk, capped at 100, max 5 factors listed", () => {
    const r = getRiskScore(fixture(1));
    expect(r.level).toBe("high");
    expect(r.score).toBe(100);
    expect(r.factors).toHaveLength(5);
  });

  it("blank default (all-2s) is high risk", () => {
    // Score 2 counts as a gap for critical/security/compliance factors.
    const r = getRiskScore(makeBlankAssessment());
    expect(r.level).toBe("high");
  });
});

describe("derived metrics — golden values", () => {
  it("business impact categories at the four corners", () => {
    expect(getBusinessImpact(fixture(5)).category).toBe("High Value Opportunity");
    expect(getBusinessImpact(fixture(1)).category).toBe("Risk Mitigation Priority");
    expect(getBusinessImpact(fixture(3)).category).toBe("Strategic Investment Required");
  });

  it("ROI bands", () => {
    expect(getROIOpportunity(fixture(5)).range).toBe("15-25%");
    expect(getROIOpportunity(fixture(1)).range).toBe("3-8%");
  });

  it("operational/efficiency/exposure scores for mixed fixture are stable", () => {
    const a = mixedFixture();
    expect(getOperationalImpactScore(a)).toMatchInlineSnapshot(`60`);
    expect(getEfficiencyOpportunityScoreStable(a)).toMatchInlineSnapshot(`49`);
    expect(getRiskExposureScore(a)).toMatchInlineSnapshot(`53`);
  });

  it("maturity bands at boundaries", () => {
    expect(getBand(80).label).toBe("Advanced");
    expect(getBand(79).label).toBe("Progressing");
    expect(getBand(60).label).toBe("Progressing");
    expect(getBand(59).label).toBe("Emerging");
    expect(getBand(40).label).toBe("Emerging");
    expect(getBand(39).label).toBe("Early");
  });
});

// Wrapper so the inline snapshot name stays readable above.
function getEfficiencyOpportunityScoreStable(a: Assessment) {
  return getEfficiencyOpportunityScore(a);
}

describe("sector content", () => {
  it("opportunities and risks return exactly 3 items for every sector", () => {
    for (const s of SECTORS) {
      const a = fixture(2, s.value);
      expect(getTopOpportunities(a)).toHaveLength(3);
      expect(getTopRisks(a)).toHaveLength(3);
    }
  });

  it("invalid legacy sector falls back to 'other' without crashing", () => {
    const a = fixture(3);
    // simulate legacy persisted value
    (a as { sector: string }).sector = "general";
    expect(() => getTopOpportunities(a)).not.toThrow();
    expect(getTopOpportunities(a)).toHaveLength(3);
  });
});

describe("roadmap generation", () => {
  it("returns exactly 3 phases with items in each", () => {
    const phases = generateRoadmap(mixedFixture());
    expect(phases.map((p) => p.phase)).toEqual([
      "Phase 1 — Foundation",
      "Phase 2 — Build",
      "Phase 3 — Scale",
    ]);
    for (const phase of phases) {
      expect(phase.items.length).toBeGreaterThan(0);
    }
  });

  it("all-5s puts every pillar in the Scale phase (capped at 4 items)", () => {
    const phases = generateRoadmap(fixture(5));
    expect(phases[2].items.length).toBeLessThanOrEqual(4);
    expect(phases[0].items[0].pillar).toBe("Quick Wins"); // fallback item
  });
});

describe("executive summary", () => {
  it("contains the key computed figures", () => {
    const a = mixedFixture();
    a.businessName = "Acme Ltd";
    const text = generateExecutiveSummary(a);
    expect(text).toContain("Acme Ltd");
    expect(text).toContain(`${getWeightedOverallScore(a)}%`);
    expect(text).toContain("Top 3 AI Opportunities");
  });
});
