// src/lib/activityLog.ts
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ActivityType = Database["public"]["Enums"]["activity_type"];

type ActivityEvent = {
  projectId: string;
  type: ActivityType;     // activity_logs.type (enum)
  entityType: string;     // activity_logs.entity_type
  entityId: string;       // activity_logs.entity_id
  description: string;    // activity_logs.description
};

export async function logActivity(e: ActivityEvent): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { error } = await supabase.from("activity_logs").insert({
      project_id: e.projectId,
      type: e.type,
      entity_type: e.entityType,
      entity_id: e.entityId,
      description: e.description,
    });

    if (error) {
      console.warn("Activity log insert failed:", error);
      return { ok: false, message: error.message ?? "Unknown Supabase error" };
    }

    return { ok: true };
  } catch (err: any) {
    console.warn("Activity log insert threw:", err);
    return { ok: false, message: err?.message ?? "Unknown error" };
  }
}