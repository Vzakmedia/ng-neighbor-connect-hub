import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

interface Props {
  data: { range: string; count: number }[];
  selectedRanges: string[];
  onRangeClick: (range: string) => void;
}

export function PriceHistogram({ data, selectedRanges, onRangeClick }: Props) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      range: item.range,
      count: item.count,
      isSelected: selectedRanges.includes(item.range)
    }));
  }, [data, selectedRanges]);

  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} onClick={(e) => {
          if (e?.activeLabel) {
            onRangeClick(e.activeLabel);
          }
        }}>
          <XAxis 
            dataKey="range" 
            axisLine={false}
            tickLine={false}
            className="text-xs text-muted-foreground"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            className="text-xs text-muted-foreground"
          />
          <Bar 
            dataKey="count" 
            radius={[4, 4, 0, 0]}
            className="cursor-pointer"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.isSelected ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Click on bars to filter by price range
      </p>
    </div>
  );
}
