import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { id, eventId } = await params;
  const eid = parseInt(eventId, 10);
  const cid = parseInt(id, 10);
  if (isNaN(eid) || isNaN(cid)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
 
  const event = await prisma.event.findFirst({ where: { id: eid, customerId: cid } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
 
  await prisma.event.delete({ where: { id: eid } });
  return NextResponse.json({ message: "Deleted" });
}
