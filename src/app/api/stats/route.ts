import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function GET() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
 
  const [customerCount, emailCount, eventCount, recentEvents, allCustomers] =
    await Promise.all([
      prisma.customer.count(),
      prisma.email.count(),
      prisma.event.count(),
      prisma.event.findMany({
        orderBy: { date: "desc" },
        take: 10,
        include: {
          customer: { select: { id: true, name: true, companyName: true } },
          email: {
            select: {
              analysis: {
                select: { priority: true, categories: true },
              },
            },
          },
        },
      }),
      prisma.customer.findMany({
        include: {
          events: {
            orderBy: { date: "desc" },
            take: 1,
            select: { date: true, type: true, title: true },
          },
          _count: { select: { events: true } },
        },
      }),
    ]);
 
  const needsAttention = allCustomers
    .filter((c) => {
      const lastEvent = c.events[0];
      if (!lastEvent) return true;
      return new Date(lastEvent.date) < sevenDaysAgo;
    })
    .map((c) => ({
      id: c.id,
      name: c.name,
      companyName: c.companyName,
      lastEventDate: c.events[0]?.date || c.createdAt,
      lastEventTitle: c.events[0]?.title || "Brak wydarzeń",
      eventCount: c._count.events,
    }))
    .sort((a, b) => new Date(a.lastEventDate).getTime() - new Date(b.lastEventDate).getTime());
 
  return NextResponse.json({
    customerCount,
    emailCount,
    eventCount,
    recentEvents: recentEvents.map((e) => ({
      id: e.id,
      type: e.type,
      level: e.level,
      title: e.title,
      date: e.date,
      customerId: e.customer.id,
      customerName: e.customer.name,
      customerCompany: e.customer.companyName,
      priority: e.email?.analysis?.priority || 3,
      categories: e.email?.analysis?.categories || [],
    })),
    needsAttention,
  });
}
