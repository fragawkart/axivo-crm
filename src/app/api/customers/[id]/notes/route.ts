import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function POST(
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
  });
 
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
 
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
 
  const title = body?.title?.trim();
  const description = body?.description?.trim() || "";
 
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
 
  const event = await prisma.event.create({
    data: {
      type: "NOTE",
      level: "MINOR",
      title,
      description,
      date: new Date(),
      customerId,
    },
  });
 
  return NextResponse.json(event, { status: 201 });
}
