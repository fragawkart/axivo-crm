import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function GET() {
  const [customerCount, emailCount, eventCount, recentEvents] =
    await Promise.all([
      prisma.customer.count(),
      prisma.email.count(),
      prisma.event.count(),
      prisma.event.findMany({
        orderBy: { date: "desc" },
        take: 10,
        include: {
          customer: { select: { name: true, companyName: true } },
          email: {
            select: {
              analysis: {
                select: { priority: true },
              },
            },
          },
        },
      }),
    ]);
 
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
      customerName: e.customer.name,
      customerCompany: e.customer.companyName,
      priority: e.email?.analysis?.priority || 3,
    })),
  });
}
