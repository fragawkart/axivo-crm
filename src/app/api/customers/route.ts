import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      events: { orderBy: { date: "desc" }, take: 1, select: { date: true, title: true, type: true } },
      _count: { select: { events: true, emails: true } },
    },
  });
  return NextResponse.json(customers.map((c) => ({
    id: c.id, name: c.name, email: c.email, companyName: c.companyName,
    createdAt: c.createdAt, lastEvent: c.events[0] || null,
    eventCount: c._count.events, emailCount: c._count.emails,
  })));
}
 
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
 
  const email = body?.email?.trim()?.toLowerCase();
  const name = body?.name?.trim() || "";
  const companyName = body?.companyName?.trim() || "";
 
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
 
  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Klient z tym emailem już istnieje" }, { status: 409 });
 
  const customer = await prisma.customer.create({ data: { email, name, companyName } });
  return NextResponse.json(customer, { status: 201 });
}
