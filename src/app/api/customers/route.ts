import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      events: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true, title: true, type: true },
      },
      _count: { select: { events: true, emails: true } },
    },
  });
 
  const result = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    companyName: c.companyName,
    createdAt: c.createdAt,
    lastEvent: c.events[0] || null,
    eventCount: c._count.events,
    emailCount: c._count.emails,
  }));
 
  return NextResponse.json(result);
}
