import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { PerformancePoint } from "./ModelPerformanceChart.types";

interface ModelPerformanceChartProps {
  data: PerformancePoint[];
}

export default function ModelPerformanceChart({ data }: ModelPerformanceChartProps) {
  return (
    <Card className="glass-card border-border animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Model Performance</CardTitle>
        <p className="text-muted-foreground text-sm">Performance metrics over time</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No performance data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 17%)" />
              <XAxis dataKey="x" tick={{ fill: "hsl(215, 20%, 65%)" }} />
              <YAxis domain={[0, 100]} tick={{ fill: "hsl(215, 20%, 65%)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(11, 11%, 8%)",
                  border: "1px solid hsl(215, 20%, 17%)",
                  borderRadius: "0.5rem",
                  color: "hsl(210, 40%, 98%)",
                }}
                labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Line type="monotone" dataKey="y" stroke="#10b981" dot={false} strokeWidth={2} name="Performance" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
