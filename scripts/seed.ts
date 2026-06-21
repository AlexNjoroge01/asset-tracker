import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashSync } from "bcryptjs";
import * as schema from "../lib/db/schema";

const connectionString = process.env.DATABASE_URI ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URI or DATABASE_URL must be set");
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const [admin] = await db
    .insert(schema.users)
    .values({
      name: "Alex Admin",
      email: "admin@qrasset.local",
      password: hashSync("password123", 10),
      role: "admin",
    })
    .returning()
    .onConflictDoNothing();

  const userId = admin?.id;
  if (!userId) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  console.log(`✅ Created admin user: admin@qrasset.local / password123`);

  // Create 3 assets
  const assetData = [
    { name: "Dell Laptop #4", category: "laptop", description: "Finance department" },
    { name: "iPhone 14 Pro", category: "phone", description: "Field agent device" },
    { name: "Cisco Router", category: "router", description: "Server room router" },
  ];

  const createdAssets = [];
  for (const a of assetData) {
    const [asset] = await db
      .insert(schema.assets)
      .values({ ...a, qrCode: crypto.randomUUID(), createdBy: userId })
      .returning();
    createdAssets.push(asset);
    console.log(`✅ Created asset: ${a.name}`);
  }

  // Nairobi area coordinates
  const baseCoords = [
    { lat: -1.2921, lng: 36.8219 },
    { lat: -1.2980, lng: 36.8150 },
    { lat: -1.3050, lng: 36.8300 },
  ];

  // Create 5 scans per asset
  for (let ai = 0; ai < createdAssets.length; ai++) {
    const asset = createdAssets[ai];
    const base = baseCoords[ai];
    for (let si = 0; si < 5; si++) {
      const lat = base.lat + (Math.random() - 0.5) * 0.01;
      const lng = base.lng + (Math.random() - 0.5) * 0.01;
      const daysAgo = si * 2;
      const scannedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      await db.insert(schema.scans).values({
        assetId: asset.id,
        scannedBy: userId,
        latitude: lat.toFixed(7),
        longitude: lng.toFixed(7),
        accuracy: (Math.random() * 30 + 5).toFixed(2),
        scannedAt,
      });
    }
    console.log(`✅ Created 5 scans for ${asset.name}`);
  }

  console.log("\n🎉 Seed complete!");
  console.log("Login: admin@qrasset.local / password123");
}

seed().catch(console.error);
