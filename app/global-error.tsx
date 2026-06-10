"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: "system-ui, sans-serif", color: "#0f172a", background: "#faf8f5" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Something went wrong</h2>
        <p style={{ color: "#64748b", marginBottom: 24 }}>The application hit an unexpected error.</p>
        <button
          onClick={reset}
          style={{ padding: "10px 20px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
