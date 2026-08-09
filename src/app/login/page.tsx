"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const params = useSearchParams();
  const error = params.get("error");
  const [hovering, setHovering] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: 20,
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 30% 20%, rgba(37,99,235,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(124,58,237,0.1) 0%, transparent 50%)",
      }} />
      <div style={{
        position: "relative",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        borderRadius: 20,
        padding: "48px 40px",
        width: "100%",
        maxWidth: 420,
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        animation: "fadeIn 0.5s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, #2563EB, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: 1,
            boxShadow: "0 4px 20px rgba(37,99,235,0.4)",
          }}>AX</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 800, fontSize: 24, color: "#F8FAFC", letterSpacing: 1 }}>AXIVO</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: -3, letterSpacing: 2, textTransform: "uppercase" }}>CRM</div>
          </div>
        </div>

        <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 700, color: "#F8FAFC" }}>Witaj ponownie</h1>
        <p style={{ margin: "0 0 32px", fontSize: 14, color: "#94A3B8" }}>Zaloguj się aby zarządzać klientami</p>

        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#FCA5A5", fontSize: 13, marginBottom: 24,
          }}>
            {error === "AccessDenied" ? "Ten email nie ma dostępu do panelu." : "Błąd logowania. Spróbuj ponownie."}
          </div>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          style={{
            width: "100%", padding: "14px 24px", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: hovering ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
            color: "#F8FAFC", fontSize: 15, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            transition: "all 0.25s ease",
            boxShadow: hovering ? "0 4px 20px rgba(37,99,235,0.2)" : "none",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.09 24.09 0 000 21.54l7.98-6.17z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Zaloguj się przez Google
        </button>

        <p style={{ margin: "24px 0 0", fontSize: 12, color: "#475569" }}>
          Dostęp tylko dla autoryzowanych użytkowników
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}