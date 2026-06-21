import { z } from "zod";

export const createAssetSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.enum(["laptop", "phone", "router", "tablet", "other"]),
  description: z.string().max(500).optional(),
});

export const updateAssetSchema = createAssetSchema.partial().extend({
  status: z.enum(["active", "inactive", "lost"]).optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
