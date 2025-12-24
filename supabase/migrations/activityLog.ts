// src/lib/activityLog.ts
import { supabase } from "@/integrations/supabase/client";

type ActivityEvent = {
  projectId: string;
  actorId: string;
  eventType: string;   // e.g. "task.status_changed"
  entityType: string;  // e.g. "task"
  entityId: string;
  summary: string;
  metadata?: Record<string, any>;
};

/**
 * Best-effort activity logging: failures never break the main UX.
 */
export async function logActivity(e: ActivityEvent) {
  try {
    const { error } = await supabase.from("activity_logs").insert({
      project_id: e.projectId,
      actor_id: e.actorId,
      event_type: e.eventType,
      entity_type: e.entityType,
      entity_id: e.entityId,
      summary: e.summary,
      metadata: e.metadata ?? {},
    });

    if (error) console.warn("Activity log insert failed:", error);
  } catch (err) {
    console.warn("Activity log insert threw:", err);
  }
}
