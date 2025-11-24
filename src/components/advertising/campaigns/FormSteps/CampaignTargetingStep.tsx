import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { MapPin } from '@/lib/icons';

interface CampaignTargetingStepProps {
  form: UseFormReturn<any>;
}

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
];

export const CampaignTargetingStep = ({ form }: CampaignTargetingStepProps) => {
  const { watch, setValue } = form;
  const targetScope = watch('target_geographic_scope');
  const targetStates = watch('target_states') || [];

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-muted/50">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Geographic Targeting</h3>
            <p className="text-sm text-muted-foreground">
              Your campaign will be shown to users in the selected geographic area based on your pricing tier.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <Label className="mb-2 block">Target Scope</Label>
        <div className="p-4 border rounded-lg bg-background">
          <p className="font-medium">{targetScope === 'nationwide' ? 'Nationwide' : targetScope === 'state' ? 'State Level' : 'City Level'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            This is determined by your selected pricing tier
          </p>
        </div>
      </div>

      {targetScope === 'state' && (
        <div>
          <Label htmlFor="target_states">Target States (Optional)</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Leave empty to target all states
          </p>
          <Select
            value={targetStates[0] || ''}
            onValueChange={(value) => setValue('target_states', [value])}
          >
            <SelectTrigger id="target_states">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {nigerianStates.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card className="p-4 border-primary/20 bg-primary/5">
        <h4 className="font-semibold mb-2">Review Your Campaign</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Campaign:</span>
            <span className="font-medium">{watch('campaign_name') || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{watch('duration_days')} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Budget:</span>
            <span className="font-medium text-primary">₦{watch('total_budget')?.toLocaleString() || 0}</span>
          </div>
        </div>
      </Card>

      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> After clicking "Create & Pay", you'll be redirected to complete the payment. 
          Your campaign will be reviewed and activated once payment is confirmed.
        </p>
      </div>
    </div>
  );
};