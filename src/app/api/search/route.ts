import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json([]);
 
  const query = `%${q}%`;
 
  // Search across customers, emails, and events
  const [customers, emails, events] = await Promise.all([
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { companyName: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, name: true, email: true, companyName: true },
    }),
    prisma.email.findMany({
      where: {
        OR: [
          { subject: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, subject: true, fromEmail: true, customerId: true, receivedAt: true,
        customer: { select: { name: true } } },
    }),
    prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: { id: true, title: true, type: true, date: true, customerId: true,
        customer: { select: { name: true } } },
    }),
  ]);
 
  return NextResponse.json({
    customers: customers.map((c) => ({ ...c, resultType: "customer" })),
    emails: emails.map((e) => ({
      id: e.id, subject: e.subject, fromEmail: e.fromEmail,
      customerId: e.customerId, customerName: e.customer.name,
      date: e.receivedAt, resultType: "email",
    })),
    events: events.map((e) => ({
      id: e.id, title: e.title, type: e.type,
      customerId: e.customerId, customerName: e.customer.name,
      date: e.date, resultType: "event",
    })),
  });
}
