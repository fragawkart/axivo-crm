import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  const customers = await prisma.customer.findMany({
    include: {
      events: {
        orderBy: { date: "desc" },
        take: 10,
        include: {
          email: {
            include: { analysis: true },
          },
        },
      },
      _count: { select: { events: true, emails: true } },
    },
  });

  if (customers.length === 0) {
    return NextResponse.json({ insights: [] });
  }

  const now = new Date();
  const customerSummaries = customers.map((c) => {
    const lastEvent = c.events[0];
    const daysSinceContact = lastEvent
      ? Math.floor((now.getTime() - new Date(lastEvent.date).getTime()) / 86400000)
      : 999;

    const recentEvents = c.events.map((e) => {
      const analysis = e.email?.analysis;
      return `  - ${e.date.toISOString().slice(0, 10)} | ${e.type} | ${e.title}${analysis ? ` | priorytet: ${analysis.priority} | kategorie: ${analysis.categories.join(", ")}` : ""}`;
    }).join("\n");

    return `KLIENT: ${c.name || "Brak nazwy"} (${c.email})\nFirma: ${c.companyName || "nieznana"}\nOstatni kontakt: ${daysSinceContact} dni temu\nLaczne wydarzenia: ${c._count.events}, emaile: ${c._count.emails}\nOstatnie wydarzenia:\n${recentEvents || "  (brak)"}`;
  }).join("\n\n---\n\n");

  const prompt = `Jestes asystentem CRM. Przeanalizuj ponizsze dane klientow i wygeneruj 3-6 insightow biznesowych.

Kazdy insight powinien miec:
- "color": "red" (pilne, wymaga natychmiastowej reakcji), "yellow" (uwaga, warto sie zajac), lub "green" (szansa, pozytywna obserwacja)
- "title": krotki tytul (max 10 slow)
- "description": 1-2 zdania z konkretnym kontekstem — imie klienta, firma, kwoty jesli znane, ile dni bez kontaktu, co dokladnie sie dzieje

Zasady:
- RED: klienci z priorytetem 1-2 czekajacy 3+ dni na odpowiedz, reklamacje bez follow-upu, wazne sprawy bez reakcji
- YELLOW: klienci bez kontaktu 5+ dni, negocjacje ktore sie zatrzymaly, pytania bez odpowiedzi
- GREEN: nowi klienci wykazujacy zainteresowanie, klienci z wieloma interakcjami, szanse na upsell

Odpowiedz TYLKO jako JSON array, bez zadnego dodatkowego tekstu:
[{"color":"red","title":"...","description":"..."},...]

DANE KLIENTOW:

${customerSummaries}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "AI request failed" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "[]";

    let insights;
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      insights = JSON.parse(clean);
    } catch {
      console.error("Failed to parse AI response:", text);
      insights = [];
    }

    return NextResponse.json({ insights });
  } catch (err) {
    console.error("Insights error:", err);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}