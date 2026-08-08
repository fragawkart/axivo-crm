import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customerId = parseInt(id, 10);
 
  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
 
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      events: {
        orderBy: { date: "desc" },
        include: {
          email: {
            include: {
              analysis: true,
            },
          },
        },
      },
      _count: { select: { events: true, emails: true } },
    },
  });
 
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
 
  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    companyName: customer.companyName,
    createdAt: customer.createdAt,
    eventCount: customer._count.events,
    emailCount: customer._count.emails,
    events: customer.events.map((e) => ({
      id: e.id,
      type: e.type,
      level: e.level,
      title: e.title,
      description: e.description,
      date: e.date,
      emailSubject: e.email?.subject || null,
      emailBody: e.email?.body || null,
      emailFrom: e.email?.fromEmail || null,
      analysis: e.email?.analysis
        ? {
            priority: e.email.analysis.priority,
            categories: e.email.analysis.categories,
            summary: e.email.analysis.summary,
            suggestedReply: e.email.analysis.suggestedReply,
            reason: e.email.analysis.reason,
          }
        : null,
    })),
  });
}
