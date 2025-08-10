import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PricingTier {
  id?: string;
  name: string;
  ad_type: string;
  geographic_scope: string;
  base_price_per_day: number;
  impressions_included?: number;
  click_rate_multiplier?: number;
  priority_level?: number;
  max_duration_days?: number;
  is_active?: boolean;
}

const defaultTier: PricingTier = {
  name: "Standard",
  ad_type: "advertisement",
  geographic_scope: "city",
  base_price_per_day: 1000,
  impressions_included: 1000,
  click_rate_multiplier: 1.0,
  priority_level: 1,
  max_duration_days: 30,
  is_active: true,
};

export default function AdsSettingsPanel() {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);

  // Global settings
  const [requireManualApproval, setRequireManualApproval] = useState<boolean>(true);
  const [minDailyBudget, setMinDailyBudget] = useState<number>(500);
  const [maxActivePerUser, setMaxActivePerUser] = useState<number>(5);
  const [enableGeoTargeting, setEnableGeoTargeting] = useState<boolean>(true);
  const [defaultGeographicScope, setDefaultGeographicScope] = useState<string>("city");

  const loadTiers = async () => {
    try {
      setLoadingTiers(true);
      const { data, error } = await supabase
        .from("ad_pricing_tiers")
        .select("*")
        .order("priority_level", { ascending: false });
      if (error) throw error;
      setTiers((data as PricingTier[]) || []);
    } catch (err) {
      console.error("Failed to load tiers", err);
      toast({ title: "Error", description: "Failed to load pricing tiers", variant: "destructive" });
    } finally {
      setLoadingTiers(false);
    }
  };

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("app_configuration")
        .select("config_key, config_value")
        .in("config_key", [
          "ads.require_manual_approval",
          "ads.min_daily_budget",
          "ads.max_active_per_user",
          "ads.enable_geo_targeting",
          "ads.default_geographic_scope",
        ]);
      if (error) throw error;
      const map: Record<string, any> = {};
      (data || []).forEach((c: any) => (map[c.config_key] = c.config_value));
      setRequireManualApproval(map["ads.require_manual_approval"] ?? true);
      setMinDailyBudget(map["ads.min_daily_budget"] ?? 500);
      setMaxActivePerUser(map["ads.max_active_per_user"] ?? 5);
      setEnableGeoTargeting(map["ads.enable_geo_targeting"] ?? true);
      setDefaultGeographicScope(map["ads.default_geographic_scope"] ?? "city");
    } catch (err) {
      console.error("Failed to load ads config", err);
    }
  };

  useEffect(() => {
    loadTiers();
    loadConfig();
  }, []);

  const upsertConfig = async (key: string, value: any, description?: string) => {
    const payload = {
      config_key: key,
      config_value: value,
      config_type: "ads_settings",
      description: description || `Configuration for ${key}`,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
      is_public: false,
    } as any;
    const { error } = await supabase.from("app_configuration").upsert(payload, { onConflict: "config_key" });
    if (error) throw error;
  };

  const saveGlobalSettings = async () => {
    try {
      setSaving(true);
      await Promise.all([
        upsertConfig("ads.require_manual_approval", requireManualApproval, "Require manual approval for paid ads"),
        upsertConfig("ads.min_daily_budget", minDailyBudget, "Minimum daily budget for ad campaigns"),
        upsertConfig("ads.max_active_per_user", maxActivePerUser, "Max active ad campaigns per user"),
        upsertConfig("ads.enable_geo_targeting", enableGeoTargeting, "Enable geographic targeting for ads"),
        upsertConfig("ads.default_geographic_scope", defaultGeographicScope, "Default geographic scope for new campaigns"),
      ]);
      toast({ title: "Ad settings saved" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const startCreate = () => {
    setEditingTier({ ...defaultTier });
    setDialogOpen(true);
  };

  const startEdit = (tier: PricingTier) => {
    setEditingTier({ ...tier });
    setDialogOpen(true);
  };

  const saveTier = async () => {
    if (!editingTier) return;
    try {
      setSaving(true);
      const payload: any = {
        name: editingTier.name,
        ad_type: editingTier.ad_type,
        geographic_scope: editingTier.geographic_scope,
        base_price_per_day: Number(editingTier.base_price_per_day),
        impressions_included: Number(editingTier.impressions_included || 0),
        click_rate_multiplier: Number(editingTier.click_rate_multiplier || 1),
        priority_level: Number(editingTier.priority_level || 1),
        max_duration_days: Number(editingTier.max_duration_days || 30),
        is_active: editingTier.is_active !== false,
      };
      if (editingTier.id) {
        const { error } = await supabase.from("ad_pricing_tiers").update(payload).eq("id", editingTier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ad_pricing_tiers").insert(payload);
        if (error) throw error;
      }
      setDialogOpen(false);
      setEditingTier(null);
      await loadTiers();
      toast({ title: "Pricing tier saved" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to save tier", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteTier = async (tierId: string) => {
    try {
      const { error } = await supabase.from("ad_pricing_tiers").delete().eq("id", tierId);
      if (error) throw error;
      await loadTiers();
      toast({ title: "Tier deleted" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to delete tier", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ad Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="block mb-1">Require Manual Approval</Label>
                  <p className="text-sm text-muted-foreground">Paid ads must be approved by admin before going live</p>
                </div>
                <Switch checked={requireManualApproval} onCheckedChange={setRequireManualApproval} />
              </div>

              <div>
                <Label className="block mb-1">Minimum Daily Budget (₦)</Label>
                <Input type="number" min={0} value={minDailyBudget} onChange={(e) => setMinDailyBudget(Number(e.target.value))} />
              </div>

              <div>
                <Label className="block mb-1">Max Active Campaigns Per User</Label>
                <Input type="number" min={1} value={maxActivePerUser} onChange={(e) => setMaxActivePerUser(Number(e.target.value))} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="block mb-1">Enable Geo Targeting</Label>
                  <p className="text-sm text-muted-foreground">Allow campaigns to target states or cities</p>
                </div>
                <Switch checked={enableGeoTargeting} onCheckedChange={setEnableGeoTargeting} />
              </div>

              <div>
                <Label className="block mb-1">Default Geographic Scope</Label>
                <Select value={defaultGeographicScope} onValueChange={setDefaultGeographicScope}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nationwide">Nationwide</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={saveGlobalSettings} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pricing Tiers</CardTitle>
          <Button size="sm" onClick={startCreate}>Add Tier</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Ad Type</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Base Price (₦/day)</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>CTR Multiplier</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Max Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">{loadingTiers ? "Loading..." : "No pricing tiers yet"}</TableCell>
                </TableRow>
              )}
              {tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.name}</TableCell>
                  <TableCell><Badge variant="outline">{tier.ad_type}</Badge></TableCell>
                  <TableCell>{tier.geographic_scope}</TableCell>
                  <TableCell>₦{Number(tier.base_price_per_day).toLocaleString()}</TableCell>
                  <TableCell>{tier.impressions_included}</TableCell>
                  <TableCell>{tier.click_rate_multiplier}</TableCell>
                  <TableCell>{tier.priority_level}</TableCell>
                  <TableCell>{tier.max_duration_days}</TableCell>
                  <TableCell>{tier.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(tier)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => tier.id && deleteTier(tier.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTier?.id ? "Edit Pricing Tier" : "Create Pricing Tier"}</DialogTitle>
          </DialogHeader>
          {editingTier && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="block mb-1">Name</Label>
                <Input value={editingTier.name} onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })} />
              </div>
              <div>
                <Label className="block mb-1">Ad Type</Label>
                <Select value={editingTier.ad_type} onValueChange={(v) => setEditingTier({ ...editingTier, ad_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block mb-1">Geographic Scope</Label>
                <Select value={editingTier.geographic_scope} onValueChange={(v) => setEditingTier({ ...editingTier, geographic_scope: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nationwide">Nationwide</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="city">City</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block mb-1">Base Price Per Day (₦)</Label>
                <Input type="number" min={0} value={editingTier.base_price_per_day} onChange={(e) => setEditingTier({ ...editingTier, base_price_per_day: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="block mb-1">Impressions Included</Label>
                <Input type="number" min={0} value={editingTier.impressions_included} onChange={(e) => setEditingTier({ ...editingTier, impressions_included: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="block mb-1">Click Rate Multiplier</Label>
                <Input type="number" step="0.1" value={editingTier.click_rate_multiplier} onChange={(e) => setEditingTier({ ...editingTier, click_rate_multiplier: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="block mb-1">Priority Level</Label>
                <Input type="number" min={1} value={editingTier.priority_level} onChange={(e) => setEditingTier({ ...editingTier, priority_level: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="block mb-1">Max Duration (days)</Label>
                <Input type="number" min={1} value={editingTier.max_duration_days} onChange={(e) => setEditingTier({ ...editingTier, max_duration_days: Number(e.target.value) })} />
              </div>
              <div className="flex items-center justify-between md:col-span-2">
                <Label>Active</Label>
                <Switch checked={editingTier.is_active !== false} onCheckedChange={(v) => setEditingTier({ ...editingTier, is_active: v })} />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveTier} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
