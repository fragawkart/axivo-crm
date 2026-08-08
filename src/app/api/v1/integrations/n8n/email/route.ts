import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventLevel } from "@/lib/event-rules";
 
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
 
  // 3. Validate required fields
  const gmailId = body?.email?.gmail_message_id;
  const customerEmail = body?.customer?.email;
  const eventType = body?.event?.type;
 
  if (!gmailId || !customerEmail || !eventType) {
    return NextResponse.json(
      { error: "Missing required fields: email.gmail_message_id, customer.email, event.type" },
      { status: 400 }
    );
  }
 
  // 4. Check duplicate
  const existing = await prisma.email.findUnique({
    where: { source_externalId: { source: "n8n_email", externalId: gmailId } },
  });
 
  if (existing) {
    return NextResponse.json({ message: "Already processed", email_id: existing.id }, { status: 200 });
  }
 
  // 5. Upsert customer
  let customer = await prisma.customer.findUnique({ where: { email: customerEmail } });
 
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        email: customerEmail,
        name: body.customer?.name || "",
        companyName: body.customer?.company_name || "",
      },
    });
  } else if (!customer.companyName && body.customer?.company_name) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: { companyName: body.customer.company_name },
    });
  }
 
  // 6. Save email
  const email = await prisma.email.create({
    data: {
      source: body.source || "n8n_email",
      externalId: gmailId,
      threadId: body.email?.gmail_thread_id || "",
      fromName: body.email?.from_name || "",
      fromEmail: body.email?.from_email || "",
      subject: body.email?.subject || "",
      body: (body.email?.body || "").substring(0, 10000),
      receivedAt: body.email?.received_at ? new Date(body.email.received_at) : new Date(),
      customerId: customer.id,
    },
  });
 
  // 7. Save analysis
  const analysis = await prisma.emailAnalysis.create({
    data: {
      priority: body.analysis?.priority || 4,
      categories: body.analysis?.categories || [],
      reason: body.analysis?.reason || "",
      summary: body.analysis?.summary || "",
      suggestedReply: body.analysis?.suggested_reply || "",
      emailId: email.id,
    },
  });
 
  // 8. Create event (level determined by backend rules)
  const level = getEventLevel(eventType);
 
  const event = await prisma.event.create({
    data: {
      type: eventType,
      level: level,
      title: body.event?.title || body.email?.subject || "Nowa wiadomość",
      description: body.event?.description || "",
      date: body.email?.received_at ? new Date(body.email.received_at) : new Date(),
      customerId: customer.id,
      emailId: email.id,
    },
  });
 
  // 9. Return
  return NextResponse.json(
    {
      message: "OK",
      customer_id: customer.id,
      email_id: email.id,
      analysis_id: analysis.id,
      event_id: event.id,
    },
    { status: 201 }
  );
}
