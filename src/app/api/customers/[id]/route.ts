import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = parseInt(id, 10);
  if (isNaN(customerId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
 
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      events: { orderBy: { date: "desc" }, include: { email: { include: { analysis: true } } } },
      _count: { select: { events: true, emails: true } },
    },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
 
  return NextResponse.json({
    id: customer.id, name: customer.name, email: customer.email,
    companyName: customer.companyName, createdAt: customer.createdAt,
    phone: customer.phone, preferredLanguage: customer.preferredLanguage,
    position: customer.position, companyAddress: customer.companyAddress,
    industry: customer.industry, website: customer.website,
    responsiblePerson: customer.responsiblePerson,
    eventCount: customer._count.events, emailCount: customer._count.emails,
    events: customer.events.map((e) => ({
      id: e.id, type: e.type, level: e.level, title: e.title, description: e.description,
      date: e.date, emailThreadId: e.email?.threadId || null,
      emailSubject: e.email?.subject || null, emailBody: e.email?.body || null,
      emailFrom: e.email?.fromEmail || null,
      analysis: e.email?.analysis ? {
        priority: e.email.analysis.priority, categories: e.email.analysis.categories,
        summary: e.email.analysis.summary, suggestedReply: e.email.analysis.suggestedReply,
        reason: e.email.analysis.reason,
      } : null,
    })),
  });
}
 
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = parseInt(id, 10);
  if (isNaN(customerId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
 
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
 
  const data: any = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.companyName !== undefined) data.companyName = body.companyName.trim();
  if (body.email !== undefined) {
    const newEmail = body.email.trim().toLowerCase();
    const existing = await prisma.customer.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== customerId) return NextResponse.json({ error: "Ten email jest juz zajety" }, { status: 409 });
    data.email = newEmail;
  }
  if (body.phone !== undefined) data.phone = body.phone.trim();
  if (body.preferredLanguage !== undefined) data.preferredLanguage = body.preferredLanguage.trim();
  if (body.position !== undefined) data.position = body.position.trim();
  if (body.companyAddress !== undefined) data.companyAddress = body.companyAddress.trim();
  if (body.industry !== undefined) data.industry = body.industry.trim();
  if (body.website !== undefined) data.website = body.website.trim();
  if (body.responsiblePerson !== undefined) data.responsiblePerson = body.responsiblePerson.trim();
 
  const customer = await prisma.customer.update({ where: { id: customerId }, data });
  return NextResponse.json(customer);
}
 
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = parseInt(id, 10);
  if (isNaN(customerId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
 
  const emails = await prisma.email.findMany({ where: { customerId }, select: { id: true } });
  const emailIds = emails.map((e) => e.id);
 
  await prisma.emailAnalysis.deleteMany({ where: { emailId: { in: emailIds } } });
  await prisma.event.deleteMany({ where: { customerId } });
  await prisma.email.deleteMany({ where: { customerId } });
  await prisma.customer.delete({ where: { id: customerId } });
 
  return NextResponse.json({ message: "Deleted" });
}
