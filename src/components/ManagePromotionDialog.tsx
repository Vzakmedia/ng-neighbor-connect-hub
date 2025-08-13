import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ManagePromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: any | null;
  onUpdated?: (updated: any) => void;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "ended", label: "Ended" },
];

export default function ManagePromotionDialog({ open, onOpenChange, promotion, onUpdated }: ManagePromotionDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | undefined>(promotion?.status);

  useEffect(() => {
    setStatus(promotion?.status);
  }, [promotion?.id, open]);

  const updateStatus = async (next: string) => {
    if (!promotion?.id) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("promotions")
        .update({ status: next })
        .eq("id", promotion.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      setStatus(next);
      onUpdated?.(data);
      toast({ title: "Updated", description: `Campaign set to ${next}` });
    } catch (e: any) {
      console.error("Failed to update promotion status", e);
      toast({ title: "Update failed", description: e?.message || "Could not update campaign", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!status || status === promotion?.status) return onOpenChange(false);
    await updateStatus(status);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Campaign</DialogTitle>
        </DialogHeader>

        {promotion ? (
          <div className="space-y-4">
            <div>
              <div className="font-semibold">{promotion.title || "Untitled Campaign"}</div>
              <div className="text-sm text-muted-foreground">
                Created {new Date(promotion.created_at).toLocaleDateString()} • Budget ₦{Number(promotion.budget || 0).toLocaleString()}
              </div>
              <div className="mt-2">
                <Badge variant={promotion.status === "active" ? "default" : "secondary"}>{promotion.status}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" disabled={saving || promotion.status === "active"} onClick={() => updateStatus("active")}>
                Activate
              </Button>
              <Button variant="outline" disabled={saving || promotion.status === "paused"} onClick={() => updateStatus("paused")}>
                Pause
              </Button>
              <Button variant="destructive" disabled={saving || promotion.status === "ended"} onClick={() => updateStatus("ended")}>
                End
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No campaign selected.</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleSave} disabled={saving || !status || status === promotion?.status}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
