"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: "system-ui, sans-serif", color: "#0f172a" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Something went wrong</h2>
      <p style={{ color: "#64748b", marginBottom: 24, maxWidth: 420, textAlign: "center" }}>
        {error.message || "An unexpected error occurred."}
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={reset}
          style={{ padding: "10px 20px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
        >
          Try again
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("ai-readiness-assessments-v3");
            localStorage.removeItem("ai-readiness-active-id-v3");
            window.location.reload();
          }}
          style={{ padding: "10px 20px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
        >
          Reset my data
        </button>
      </div>
    </div>
  );
}
