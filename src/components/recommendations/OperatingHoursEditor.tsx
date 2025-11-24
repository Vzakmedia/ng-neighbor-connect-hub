import { OperatingHours } from '@/types/recommendations';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';

interface OperatingHoursEditorProps {
  value: OperatingHours;
  onChange: (hours: OperatingHours) => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const DAY_LABELS: Record<typeof DAYS[number], string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const OperatingHoursEditor = ({ value, onChange }: OperatingHoursEditorProps) => {
  const updateDay = (day: typeof DAYS[number], field: 'open' | 'close' | 'closed', val: string | boolean) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        [field]: val,
      },
    });
  };

  const copyToAll = (day: typeof DAYS[number]) => {
    const template = value[day];
    if (!template) return;

    const newHours: OperatingHours = {};
    DAYS.forEach(d => {
      newHours[d] = { ...template };
    });
    onChange(newHours);
  };

  return (
    <div className="space-y-3">
      {DAYS.map((day) => (
        <Card key={day} className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center justify-between sm:w-32">
              <Label className="font-medium">{DAY_LABELS[day]}</Label>
              <Switch
                checked={!value[day]?.closed}
                onCheckedChange={(checked) => updateDay(day, 'closed', !checked)}
              />
            </div>

            {!value[day]?.closed && (
              <>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={value[day]?.open || '09:00'}
                    onChange={(e) => updateDay(day, 'open', e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={value[day]?.close || '17:00'}
                    onChange={(e) => updateDay(day, 'close', e.target.value)}
                    className="flex-1"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => copyToAll(day)}
                  className="text-xs text-primary hover:underline whitespace-nowrap"
                >
                  Copy to all
                </button>
              </>
            )}

            {value[day]?.closed && (
              <span className="text-sm text-muted-foreground italic">Closed</span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
