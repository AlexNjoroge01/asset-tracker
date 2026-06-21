import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { assets, scans, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { updateAssetSchema } from "@/lib/validations/asset";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [asset] = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scanRows = await db
    .select({
      id: scans.id,
      assetId: scans.assetId,
      scannedBy: scans.scannedBy,
      latitude: scans.latitude,
      longitude: scans.longitude,
      accuracy: scans.accuracy,
      notes: scans.notes,
      deviceInfo: scans.deviceInfo,
      scannedAt: scans.scannedAt,
      scannerName: users.name,
    })
    .from(scans)
    .leftJoin(users, eq(scans.scannedBy, users.id))
    .where(eq(scans.assetId, id))
    .orderBy(desc(scans.scannedAt));

  return NextResponse.json({
    ...asset,
    scans: scanRows.map((s) => ({
      ...s,
      latitude: parseFloat(s.latitude as unknown as string),
      longitude: parseFloat(s.longitude as unknown as string),
      accuracy: s.accuracy ? parseFloat(s.accuracy as unknown as string) : null,
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(assets)
    .set(parsed.data)
    .where(eq(assets.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db.update(assets).set({ status: "inactive" }).where(eq(assets.id, id));

  return NextResponse.json({ success: true });
}
