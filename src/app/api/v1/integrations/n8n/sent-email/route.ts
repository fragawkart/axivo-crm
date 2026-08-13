import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function POST(req: NextRequest) {
  // 1. Auth
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.N8N_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
 
  // 2. Parse body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
 
  // 3. Validate
  const gmailId = body?.email?.gmail_message_id;
  const threadId = body?.email?.gmail_thread_id || "";
  const toEmail = body?.email?.to_email || "";
  const subject = body?.email?.subject || "";
 
  if (!gmailId) {
    return NextResponse.json({ error: "Missing email.gmail_message_id" }, { status: 400 });
  }
 
  // 4. Check duplicate
  const existing = await prisma.email.findUnique({
    where: { source_externalId: { source: "n8n_sent", externalId: gmailId } },
  });
  if (existing) {
    return NextResponse.json({ message: "Already processed", email_id: existing.id }, { status: 200 });
  }
 
  // 5. Find customer — first by thread_id, then by recipient email
  let customer = null;
 
  if (threadId) {
    const threadEmail = await prisma.email.findFirst({
      where: { threadId },
      include: { customer: true },
      orderBy: { receivedAt: "desc" },
    });
    if (threadEmail) customer = threadEmail.customer;
  }
 
  if (!customer && toEmail) {
    customer = await prisma.customer.findUnique({ where: { email: toEmail } });
  }
 
  if (!customer) {
    return NextResponse.json(
      { message: "Skipped — no matching customer for this thread/email" },
      { status: 200 }
    );
  }
 
  // 6. Save sent email
  const email = await prisma.email.create({
    data: {
      source: "n8n_sent",
      externalId: gmailId,
      threadId: threadId,
      fromName: body.email?.from_name || "",
      fromEmail: body.email?.from_email || "",
      subject: subject,
      body: (body.email?.body || "").substring(0, 10000),
      receivedAt: body.email?.sent_at ? new Date(body.email.sent_at) : new Date(),
      customerId: customer.id,
    },
  });
 
  // 7. Create RESPONSE event
  const event = await prisma.event.create({
    data: {
      type: "RESPONSE",
      level: "MINOR",
      title: subject.startsWith("Re:") || subject.startsWith("RE:")
        ? "Odpowiedź: " + subject.replace(/^Re:\s*/i, "").substring(0, 80)
        : "Odpowiedź: " + subject.substring(0, 80),
      description: "",
      date: body.email?.sent_at ? new Date(body.email.sent_at) : new Date(),
      customerId: customer.id,
      emailId: email.id,
    },
  });
 
  return NextResponse.json(
    {
      message: "OK",
      customer_id: customer.id,
      email_id: email.id,
      event_id: event.id,
    },
    { status: 201 }
  );
}
