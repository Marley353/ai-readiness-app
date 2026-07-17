import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Readiness — measure your organisation's AI readiness in minutes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social share card (LinkedIn / X / Slack). Pure-code composition so the
// text stays crisp at every size; matches the site's navy + warm-amber brand.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background:
            "radial-gradient(90% 120% at 80% 10%, #0a1530 0%, #050914 55%, #030610 100%)",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* amber glow accent */}
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -100,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(255,183,112,0.28), transparent 65%)",
            display: "flex",
          }}
        />
        {/* violet counter-glow */}
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: -80,
            width: 460,
            height: 460,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(167,139,250,0.18), transparent 65%)",
            display: "flex",
          }}
        />

        {/* Left — copy */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 48 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 36,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 9999,
                background: "#ffb770",
                boxShadow: "0 0 24px 6px rgba(255,183,112,0.6)",
                display: "flex",
              }}
            />
            <div style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", display: "flex" }}>
              AI Readiness
            </div>
          </div>

          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-2px",
              color: "#F4F5F7",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Measure your organisation&apos;s</span>
            <span style={{ color: "#ffb770" }}>AI readiness in minutes</span>
          </div>

          <div
            style={{
              marginTop: 28,
              fontSize: 26,
              color: "rgba(255,255,255,0.6)",
              display: "flex",
            }}
          >
            8 dimensions · Industry benchmarks · Board-ready roadmap
          </div>
        </div>

        {/* Right — score ring motif */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 320,
            height: 320,
            borderRadius: 9999,
            border: "3px solid rgba(255,255,255,0.08)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 9999,
              border: "14px solid rgba(255,183,112,0.9)",
              borderRightColor: "rgba(255,255,255,0.1)",
              borderBottomColor: "rgba(255,255,255,0.1)",
              transform: "rotate(-45deg)",
              display: "flex",
              boxShadow: "0 0 60px rgba(255,183,112,0.35)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 96, fontWeight: 700, color: "#ffffff", display: "flex", lineHeight: 1 }}>
              73
            </div>
            <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", display: "flex" }}>/100</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#ffb770", marginTop: 10, display: "flex" }}>
              Emerging Leader
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
