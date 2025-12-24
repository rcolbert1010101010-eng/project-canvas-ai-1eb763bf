import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ActivityViewProps {
  projectId: string;
}

type ActivityLogRow = {
  id: string;
  project_id: string;
  type: string;
  entity_type: string;
  entity_id: string;
  description: string | null;
  created_at: string;
};

function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTimeLabel(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function ActivityView({ projectId }: ActivityViewProps) {
  const { toast } = useToast();

  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 50;

  const lastCreatedAt = useMemo(() => {
    if (rows.length === 0) return null;
    return rows[rows.length - 1]?.created_at ?? null;
  }, [rows]);

  const loadFirstPage = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, project_id, type, entity_type, entity_id, description, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(pageSize);

      if (error) throw error;

      const next = (data ?? []) as ActivityLogRow[];
      setRows(next);
      setHasMore(next.length === pageSize);
    } catch (e: any) {
      toast({
        title: "Error loading activity",
        description: e?.message ?? "Unable to load activity logs.",
        variant: "destructive",
      });
      setRows([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!projectId || !hasMore || !lastCreatedAt) return;

    setLoadingMore(true);
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, project_id, type, entity_type, entity_id, description, created_at")
        .eq("project_id", projectId)
        .lt("created_at", lastCreatedAt)
        .order("created_at", { ascending: false })
        .limit(pageSize);

      if (error) throw error;

      const next = (data ?? []) as ActivityLogRow[];
      setRows((prev) => [...prev, ...next]);
      setHasMore(next.length === pageSize);
    } catch (e: any) {
      toast({
        title: "Error loading more activity",
        description: e?.message ?? "Unable to load more activity logs.",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setRows([]);
    setHasMore(true);
    void loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityLogRow[]>();
    for (const r of rows) {
      const key = formatDateLabel(r.created_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Activity</div>
          <div className="text-sm text-muted-foreground">
            Recent changes across tasks, decisions, documents, and conversations.
          </div>
        </div>

        <Button variant="outline" onClick={loadFirstPage} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading activity…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No activity yet. Create or update a task to generate the first event.
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([day, items]) => (
                <div key={day} className="space-y-3">
                  <div className="text-xs font-medium text-muted-foreground">{day}</div>

                  <div className="space-y-3">
                    {items.map((r) => (
                      <div
                        key={r.id}
                        className={cn("rounded-md border p-3", "flex flex-col gap-1")}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{r.type}</Badge>
                          <Badge variant="outline">{r.entity_type}</Badge>
                          <div className="ml-auto text-xs text-muted-foreground">
                            {formatTimeLabel(r.created_at)}
                          </div>
                        </div>

                        <div className="text-sm">{r.description ?? "(no description)"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <Button variant="outline" onClick={loadMore} disabled={!hasMore || loadingMore}>
                  {loadingMore ? "Loading…" : hasMore ? "Load more" : "No more activity"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
