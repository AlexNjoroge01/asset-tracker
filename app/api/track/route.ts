import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { assets, trackingSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const startSchema = z.object({
  qr_code: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
  deviceInfo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { qr_code, latitude, longitude, accuracy, deviceInfo: bodyDeviceInfo } = parsed.data;

  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.qrCode, qr_code))
    .limit(1);

  if (!asset) {
    return NextResponse.json({ error: "QR code not recognised" }, { status: 404 });
  }

  const deviceInfo = bodyDeviceInfo ?? req.headers.get("user-agent") ?? undefined;

  const [session] = await db
    .insert(trackingSessions)
    .values({
      assetId: asset.id,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      accuracy: accuracy?.toString(),
      deviceInfo,
    })
    .returning();

  return NextResponse.json(
    { sessionToken: session.sessionToken, assetId: asset.id, asset },
    { status: 201 }
  );
}
