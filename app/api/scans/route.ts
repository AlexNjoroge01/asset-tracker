import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { assets, scans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createScanSchema } from "@/lib/validations/scan";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createScanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { qr_code, latitude, longitude, accuracy, notes, deviceInfo: bodyDeviceInfo } = parsed.data;

  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.qrCode, qr_code))
    .limit(1);

  if (!asset) {
    return NextResponse.json({ error: "QR code not recognised" }, { status: 404 });
  }

  const deviceInfo = bodyDeviceInfo ?? req.headers.get("user-agent");

  const [scan] = await db
    .insert(scans)
    .values({
      assetId: asset.id,
      scannedBy: session.user.id,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      accuracy: accuracy?.toString(),
      notes,
      deviceInfo,
    })
    .returning();

  return NextResponse.json({ scan, asset }, { status: 201 });
}
