import { z } from "zod";

export const createScanSchema = z.object({
  qr_code: z.string().uuid("Invalid QR code format"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
  deviceInfo: z.string().optional(),
});

export type CreateScanInput = z.infer<typeof createScanSchema>;
