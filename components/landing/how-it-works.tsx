"use client";

import { useScrollReveal } from "@/lib/gsap-hooks";

const STEPS = [
  {
    stage: "Step 1",
    title: "Take the 8-minute readiness scorecard",
    body: "Score your organisation across 8 dimensions on a simple 1-5 maturity scale. No sign-up wall, no data uploads. You walk away with a number on the board.",
  },
  {
    stage: "Step 2",
    title: "See where you stand against your sector",
    body: "Your scores are benchmarked against Cisco Index data from 8,000+ organisations. You'll know not just your score, but whether you're ahead or behind peers in your industry.",
  },
  {
    stage: "Step 3",
    title: "Get a prioritised 90-day action plan",
    body: "The platform auto-generates a phased roadmap — Foundation (0-90 days), Build (3-6 months), Scale (6-12 months) — tailored to your weakest dimensions and sector best practices.",
  },
  {
    stage: "Step 4",
    title: "Track progress and reassess quarterly",
    body: "Retake the assessment every 90 days. Pro users get a visible delta view between assessments so you can measure what actually moved — and prove it to the board.",
  },
];

export function HowItWorks() {
  const sectionRef = useScrollReveal<HTMLDivElement>({ y: 30, stagger: 0.12 });

  return (
    <section
      id="assessment"
      style={{ position: "relative", padding: "120px 24px", background: "#050914", color: "#fff" }}
    >
      <div
        ref={sectionRef}
        style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}
      >
        <div className="gsap-reveal">
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--lavender-glow)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.6px",
              display: "inline-block",
              marginBottom: 16,
            }}
          >
            How it works
          </span>
          <h2
            style={{
              fontSize: "clamp(34px, 4.4vw, 56px)",
              fontWeight: 460,
              lineHeight: 0.98,
              letterSpacing: "-1.4px",
              maxWidth: 820,
              color: "#fff",
              margin: 0,
            }}
          >
            From first click to board deck in under 8 minutes.
          </h2>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.65)",
              maxWidth: 640,
              marginTop: 20,
            }}
          >
            Our engagements have a shape. Four steps, always the same — because
            the shape is what ships.
          </p>
        </div>

        {/* Timeline */}
        <div
          style={{
            position: "relative",
            marginTop: 56,
            paddingLeft: 40,
          }}
        >
          {/* Connecting line */}
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 8,
              bottom: 0,
              width: 2,
              background: "linear-gradient(180deg, var(--lavender-glow), rgba(255,255,255,0.1))",
            }}
          />

          {STEPS.map((item, i) => (
            <div
              key={item.stage}
              className="gsap-reveal"
              style={{
                position: "relative",
                marginBottom: i < STEPS.length - 1 ? 44 : 0,
              }}
            >
              {/* Dot */}
              <span
                style={{
                  position: "absolute",
                  left: -32,
                  top: 6,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "var(--amethyst-link)",
                  boxShadow: "0 0 0 4px rgba(255,183,112,0.25)",
                }}
              />
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--lavender-glow)",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.5px",
                }}
              >
                {item.stage}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 540,
                  color: "#fff",
                  letterSpacing: "-0.4px",
                  margin: "6px 0 8px",
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 15.5,
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                {item.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
