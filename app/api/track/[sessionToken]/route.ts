import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { trackingSessions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
});

interface RouteParams {
  params: Promise<{ sessionToken: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { sessionToken } = await params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { latitude, longitude, accuracy } = parsed.data;

  const [updated] = await db
    .update(trackingSessions)
    .set({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      accuracy: accuracy?.toString() ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(trackingSessions.sessionToken, sessionToken),
        eq(trackingSessions.isActive, true)
      )
    )
    .returning({ id: trackingSessions.id });

  if (!updated) {
    return NextResponse.json({ error: "Session not found or inactive" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { sessionToken } = await params;

  await db
    .update(trackingSessions)
    .set({ isActive: false })
    .where(eq(trackingSessions.sessionToken, sessionToken));

  return NextResponse.json({ ok: true });
}
