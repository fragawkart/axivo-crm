import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
// GET — zwróć istniejące podsumowanie
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id: parseInt(id) },
    select: { aiSummary: true, aiSummaryGeneratedAt: true },
  });
  if (!customer) return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  return NextResponse.json({
    summary: customer.aiSummary || null,
    generatedAt: customer.aiSummaryGeneratedAt || null,
  });
}
 
// POST — wygeneruj nowe podsumowanie AI
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = parseInt(id);
 
  // Pobierz pełne dane klienta
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      emails: {
        include: { analysis: true },
        orderBy: { receivedAt: "desc" },
      },
      events: {
        orderBy: { date: "desc" },
      },
    },
  });
  if (!customer) return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
 
  // Zbuduj kontekst dla AI
  const now = new Date();
  const firstEvent = customer.events.length > 0 ? customer.events[customer.events.length - 1] : null;
  const lastEvent = customer.events.length > 0 ? customer.events[0] : null;
 
  const daysSinceFirst = firstEvent
    ? Math.floor((now.getTime() - new Date(firstEvent.date).getTime()) / 86400000)
    : 0;
  const daysSinceLast = lastEvent
    ? Math.floor((now.getTime() - new Date(lastEvent.date).getTime()) / 86400000)
    : 0;
 
  // Policz typy wydarzeń
  const typeCounts: Record<string, number> = {};
  customer.events.forEach((ev) => {
    typeCounts[ev.type] = (typeCounts[ev.type] || 0) + 1;
  });
 
  // Ostatnie 10 wydarzeń z detalami
  const recentEvents = customer.events.slice(0, 10).map((ev) => ({
    type: ev.type,
    title: ev.title,
    date: ev.date,
    description: ev.description?.slice(0, 200) || "",
  }));
 
  // Analizy emaili (priorytety, kategorie)
  const analyses = customer.emails
    .filter((e) => e.analysis)
    .slice(0, 10)
    .map((e) => ({
      subject: e.subject,
      priority: e.analysis!.priority,
      categories: e.analysis!.categories,
      summary: e.analysis!.summary,
      date: e.receivedAt,
    }));
 
  const contextData = {
    name: customer.name,
    company: customer.companyName || "brak",
    email: customer.email,
    phone: customer.phone || "brak",
    position: customer.position || "brak",
    industry: customer.industry || "brak",
    website: customer.website || "brak",
    totalEmails: customer.emails.length,
    totalEvents: customer.events.length,
    daysSinceFirstContact: daysSinceFirst,
    daysSinceLastContact: daysSinceLast,
    eventTypeCounts: typeCounts,
    recentEvents,
    recentAnalyses: analyses,
  };
 
  const systemPrompt = `Jesteś analitykiem CRM firmy Axivo (automatyzacja procesów biznesowych). Na podstawie danych klienta napisz zwięzłe podsumowanie biznesowe po polsku.
 
Podsumowanie powinno zawierać (w 4-6 zdaniach):
- Jak długo trwa relacja z klientem
- Częstotliwość i charakter kontaktu (ile razy, w jakich sprawach)  
- Główne tematy/problemy z ostatnich wiadomości
- Ocenę statusu relacji (aktywna/uśpiona/problemowa)
- Jeśli widać szansę sprzedażową lub ryzyko utraty klienta — wspomnij o tym
- Konkretną rekomendację co zrobić dalej
 
Pisz konkretnie, bez ogólników. Używaj danych które dostajesz. Jeśli danych jest mało, napisz co wiesz i zaznacz co warto uzupełnić.
Zwróć TYLKO tekst podsumowania, bez nagłówków, bez markdown, bez cudzysłowów.`;
 
  const userPrompt = `Dane klienta:\n${JSON.stringify(contextData, null, 2)}`;
 
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Brak klucza API OpenAI" }, { status: 500 });
 
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 500,
      }),
    });
 
    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: "Błąd API OpenAI: " + err }, { status: 500 });
    }
 
    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || "";
 
    if (!summary) {
      return NextResponse.json({ error: "AI nie zwróciło podsumowania" }, { status: 500 });
    }
 
    // Zapisz do bazy
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        aiSummary: summary,
        aiSummaryGeneratedAt: new Date(),
      },
    });
 
    return NextResponse.json({
      summary: updated.aiSummary,
      generatedAt: updated.aiSummaryGeneratedAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Błąd generowania" }, { status: 500 });
  }
}
