import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password"),
  role: text("role").notNull().default("scanner"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    qrCode: text("qr_code").unique().notNull(),
    status: text("status").notNull().default("active"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_assets_qr_code").on(t.qrCode),
    index("idx_assets_status").on(t.status),
  ]
);

export const scans = pgTable(
  "scans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .references(() => assets.id)
      .notNull(),
    scannedBy: uuid("scanned_by")
      .references(() => users.id)
      .notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    accuracy: numeric("accuracy", { precision: 6, scale: 2 }),
    notes: text("notes"),
    deviceInfo: text("device_info"),
    scannedAt: timestamp("scanned_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_scans_asset_id").on(t.assetId),
    index("idx_scans_scanned_at").on(t.scannedAt),
  ]
);
